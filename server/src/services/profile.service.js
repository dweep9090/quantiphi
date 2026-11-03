import { env } from '../config/env.js';
import { repository } from '../repositories/index.js';
import { fetchPortfolio, fetchContributions } from './github.service.js';
import { languageDistribution, contributionStats } from './stats.service.js';
import { AppError } from '../utils/AppError.js';

const fresh = (date, minutes) => date && Date.now() - new Date(date).getTime() < minutes * 60000;
const inFlight = new Map();
const userProfile = (user) => ({
  login: user.github_login || user.login, name: user.name, avatarUrl: user.avatar_url || user.avatarUrl,
  bio: user.bio, company: user.company, location: user.location, blog: user.blog,
  htmlUrl: user.html_url || user.htmlUrl, followers: user.followers || 0, following: user.following || 0,
  publicRepos: user.public_repos ?? user.publicRepos ?? 0, totalStars: user.total_stars ?? user.totalStars ?? 0
});

export async function ensureProfile(login, force = false) {
  const cached = await repository.getUser(login);
  if (!force && cached && fresh(cached.fetched_at || cached.fetchedAt, env.profileTtlMinutes)) return { user: cached, cached: true, stale: false };
  const key = login.toLowerCase();
  if (!force && inFlight.has(key)) return inFlight.get(key);
  const load = (async () => {
    try {
      const { profile, repos } = await fetchPortfolio(login);
      const user = await repository.saveProfile(profile, repos);
      return { user, cached: false, stale: false };
    } catch (error) {
      if (cached && error instanceof AppError && error.status === 429) return { user: cached, cached: true, stale: true };
      throw error;
    }
  })();
  if (!force) inFlight.set(key, load);
  try { return await load; }
  finally { if (inFlight.get(key) === load) inFlight.delete(key); }
}

export async function getProfile(login, force = false) {
  const result = await ensureProfile(login, force);
  const [languages, latest] = await Promise.all([repository.getLanguages(login), repository.latestAnalysis(login)]);
  const date = result.user.fetched_at || result.user.fetchedAt;
  return {
    cached: result.cached, stale: result.stale, fetchedAt: date,
    profile: userProfile(result.user), languages: languageDistribution(languages),
    latestCompatibility: latest ? { score: Number(latest.score), createdAt: latest.createdAt || latest.created_at } : null,
    settings: { jobDescription: await repository.getSetting(login, 'jobDescription') }
  };
}

export async function getRepos(login, sort, language) {
  const result = await ensureProfile(login);
  const activeSort = sort || await repository.getSetting(login, 'preferredRepoSort') || 'stars';
  await repository.setSetting(login, 'preferredRepoSort', activeSort);
  const repos = await repository.getRepos(login);
  const normalized = repos.map((repo) => ({
    name: repo.name, description: repo.description, stars: repo.stars || 0, forks: repo.forks || 0,
    primaryLanguage: repo.primary_language || repo.primaryLanguage, topics: repo.topics || [],
    htmlUrl: repo.html_url || repo.htmlUrl, pushedAt: repo.pushed_at || repo.pushedAt,
    languages: repo.languages || {}
  }));
  const selected = language ? normalized.filter((repo) => repo.primaryLanguage === language) : normalized;
  selected.sort(activeSort === 'name' ? (a, b) => a.name.localeCompare(b.name) : activeSort === 'updated' ? (a, b) => Date.parse(b.pushedAt || 0) - Date.parse(a.pushedAt || 0) : (a, b) => b.stars - a.stars);
  return { cached: result.cached, stale: result.stale, fetchedAt: result.user.fetched_at || result.user.fetchedAt, repos: selected };
}

export async function getContributions(login) {
  const result = await ensureProfile(login);
  const user = await repository.getUser(login);
  const oldDays = await repository.getContributions(login);
  const fetchedAt = user.contrib_fetched_at || user.contribFetchedAt;
  if (oldDays && fresh(fetchedAt, env.contribTtlMinutes)) return contributionResponse(oldDays, true, false, fetchedAt);
  try {
    const data = await fetchContributions(login);
    if (data.available) await repository.saveContributions(login, data);
    if (!data.available) return { cached: false, stale: false, fetchedAt: new Date().toISOString(), ...data, stats: contributionStats([]) };
    return { cached: false, stale: false, fetchedAt: new Date().toISOString(), ...data, stats: contributionStats(data.days) };
  } catch (error) {
    if (oldDays && error instanceof AppError && error.status === 429) return contributionResponse(oldDays, true, true, fetchedAt);
    throw error;
  }
}

function contributionResponse(days, cached, stale, fetchedAt) {
  return { cached, stale, fetchedAt, available: true, total: days.reduce((sum, day) => sum + day.count, 0), days, stats: contributionStats(days) };
}

export async function refreshProfile(login) {
  return getProfile(login, true);
}
