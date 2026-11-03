import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const api = 'https://api.github.com';
const headers = () => ({
  Accept: 'application/vnd.github+json',
  'User-Agent': 'github-developer-portfolio',
  ...(env.githubToken ? { Authorization: `Bearer ${env.githubToken}` } : {})
});

async function fetchGitHub(url, options = {}) {
  try {
    return await fetch(url, { ...options, signal: options.signal || AbortSignal.timeout(15000) });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw new AppError(504, 'GITHUB_TIMEOUT', 'GitHub did not respond in time. Please try again.');
    }
    throw new AppError(502, 'GITHUB_UNAVAILABLE', 'GitHub could not be reached. Please try again.');
  }
}

async function request(url) {
  const response = await fetchGitHub(url, { headers: headers() });
  if (response.status === 404) throw new AppError(404, 'USER_NOT_FOUND', 'That GitHub user could not be found.');
  if (response.status === 403 || response.status === 429) throw new AppError(429, 'GITHUB_RATE_LIMIT', 'GitHub is rate limiting requests. Try again later.');
  if (!response.ok) throw new AppError(502, 'GITHUB_API_ERROR', `GitHub returned status ${response.status}.`);
  return response.json();
}

async function mapConcurrent(items, limit, mapper) {
  const result = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      result[index] = await mapper(items[index]);
    }
  }));
  return result;
}

export async function fetchPortfolio(login) {
  const rawProfile = await request(`${api}/users/${encodeURIComponent(login)}`);
  const repositories = [];
  for (let page = 1; ; page += 1) {
    const batch = await request(`${api}/users/${encodeURIComponent(login)}/repos?per_page=100&type=owner&sort=updated&page=${page}`);
    repositories.push(...batch);
    if (batch.length < 100) break;
  }
  const repos = await mapConcurrent(repositories, 5, async (repo) => ({
    githubId: repo.id, name: repo.name, description: repo.description, stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0, primaryLanguage: repo.language, topics: repo.topics || [],
    htmlUrl: repo.html_url, isFork: repo.fork, pushedAt: repo.pushed_at,
    languages: await request(`${api}/repos/${encodeURIComponent(login)}/${encodeURIComponent(repo.name)}/languages`)
  }));
  return {
    profile: {
      login: rawProfile.login, name: rawProfile.name, avatarUrl: rawProfile.avatar_url, bio: rawProfile.bio,
      company: rawProfile.company, location: rawProfile.location, blog: rawProfile.blog, htmlUrl: rawProfile.html_url,
      followers: rawProfile.followers || 0, following: rawProfile.following || 0, publicRepos: rawProfile.public_repos || 0,
      totalStars: repos.reduce((total, repo) => total + repo.stars, 0), accountCreated: rawProfile.created_at
    },
    repos
  };
}

export async function fetchContributions(login) {
  if (!env.githubToken) return { available: false, reason: 'GITHUB_TOKEN not configured', total: 0, days: [] };
  const response = await fetchGitHub('https://api.github.com/graphql', {
    method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: 'query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount contributionLevel } } } } } }', variables: { login } })
  });
  if (response.status === 403 || response.status === 429) throw new AppError(429, 'GITHUB_RATE_LIMIT', 'GitHub is rate limiting requests. Try again later.');
  if (!response.ok) throw new AppError(502, 'GITHUB_API_ERROR', `GitHub returned status ${response.status}.`);
  const body = await response.json();
  if (body.errors?.length) {
    const rateLimited = body.errors.some((error) => /rate limit/i.test(error.message || ''));
    if (rateLimited) throw new AppError(429, 'GITHUB_RATE_LIMIT', 'GitHub is rate limiting requests. Try again later.');
    throw new AppError(502, 'GITHUB_API_ERROR', 'Could not load the GitHub contribution calendar.');
  }
  if (!body.data?.user) throw new AppError(502, 'GITHUB_API_ERROR', 'Could not load the GitHub contribution calendar.');
  const calendar = body.data.user.contributionsCollection.contributionCalendar;
  const levels = { NONE: 0, FIRST_QUARTILE: 1, SECOND_QUARTILE: 2, THIRD_QUARTILE: 3, FOURTH_QUARTILE: 4 };
  return {
    available: true, total: calendar.totalContributions,
    days: calendar.weeks.flatMap((week) => week.contributionDays.map((day) => ({
      date: day.date, count: day.contributionCount, level: levels[day.contributionLevel] ?? 0
    })))
  };
}
