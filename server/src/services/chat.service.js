import { repository } from '../repositories/index.js';
import { getProfile, getRepos, getContributions, ensureProfile } from './profile.service.js';
import { generateContent } from './llm.service.js';

function ruleReply(message, context) {
  const q = message.toLowerCase();
  const repos = context.repos;
  const profile = context.profile.profile;
  if (/most.star|top repo|popular repo/.test(q)) {
    const top = [...repos].sort((a, b) => b.stars - a.stars)[0];
    return top ? `${top.name} is your most-starred repository with ${top.stars} stars.` : 'I could not find any repositories in the cached profile.';
  }
  if (/strongest|top language|language/.test(q)) {
    const top = context.profile.languages[0];
    return top ? `${top.language} is your top language at ${top.percent}% of the bytes across your repositories.` : 'No language data is available yet.';
  }
  if (/star/.test(q)) return `Your repositories have ${profile.totalStars} stars in total.`;
  if (/follower/.test(q)) return `You have ${profile.followers} followers.`;
  if (/how many repos|number of repos|repositories/.test(q)) return `Your cached profile includes ${repos.length} repositories.`;
  if (/consistent|streak|active/.test(q)) return `Your current contribution streak is ${context.contributions.stats.currentStreak} days, with ${context.contributions.stats.activeDays} active days in the loaded calendar.`;
  if (/compatib|match/.test(q)) return context.profile.latestCompatibility
    ? `Your latest job-description compatibility score is ${context.profile.latestCompatibility.score}%.`
    : 'You have not analyzed a job description yet.';
  if (/recruiter|summari|about me/.test(q)) {
    const langs = context.profile.languages.slice(0, 3).map((item) => item.language).join(', ') || 'several technologies';
    return `${profile.name || profile.login} is a GitHub developer with ${profile.publicRepos} public repositories and ${profile.totalStars} stars, working primarily with ${langs}.`;
  }
  return 'You can ask about your most-starred repository, strongest language, stars, followers, repository count, contribution consistency, compatibility score, or a recruiter summary.';
}

export async function askGitHub(login, message) {
  await ensureProfile(login);
  const [profile, reposResponse, contributions, history] = await Promise.all([
    getProfile(login), getRepos(login), getContributions(login), repository.getMessages(login, 30)
  ]);
  const context = { profile, repos: reposResponse.repos.slice(0, 40), contributions };
  await repository.addMessage(login, 'user', message);
  const recent = history.slice(-6).map((item) => ({ role: item.role === 'assistant' ? 'model' : 'user', parts: [{ text: item.content }] }));
  const response = await generateContent(
    'Answer only from the provided GitHub data. Never invent numbers. If unavailable, say so. Be concise. Context: ' + JSON.stringify(context).slice(0, 18000),
    [...recent, { role: 'user', parts: [{ text: message }] }]
  );
  const reply = response || ruleReply(message, context);
  await repository.addMessage(login, 'assistant', reply);
  return { reply };
}

export async function chatHistory(login) {
  return { messages: await repository.getMessages(login, 30) };
}
