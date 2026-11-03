import { readFileSync } from 'node:fs';
import { repository } from '../repositories/index.js';
import { ensureProfile } from './profile.service.js';
import { AppError } from '../utils/AppError.js';

const skills = JSON.parse(readFileSync(new URL('../data/skills.json', import.meta.url), 'utf8'));
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function extractSkills(text) {
  const found = [];
  for (const [canonical, aliases] of Object.entries(skills)) {
    const detected = aliases.some((alias) => {
      if (canonical === 'C') return /\bC(?:\s+(?:language|programming|developer))\b/.test(text);
      if (canonical === 'Go') return /\bgolang\b/i.test(text) || (/\bGo\b/.test(text) && /\b(language|developer|programming|backend|golang)\b/i.test(text));
      if (canonical === 'Rust') return /\bRust\b/i.test(text);
      if (canonical === 'R') return /\bR\b/.test(text) && /\b(statistics|data|language|programming|developer)\b/i.test(text);
      const source = alias.trim();
      const pattern = new RegExp(`(?<![\\p{L}\\p{N}_+#])${escapeRegex(source)}(?![\\p{L}\\p{N}_+#])`, 'iu');
      return pattern.test(text);
    });
    if (detected) found.push(canonical);
  }
  return found;
}

export function computeScore(required, userSkills) {
  if (!required.length) throw new AppError(422, 'NO_SKILLS_FOUND', 'No recognized skills were found in the job description.');
  const userSet = new Set(userSkills.map((skill) => skill.toLowerCase()));
  const matched = required.filter((skill) => userSet.has(skill.toLowerCase()));
  return { matched, missing: required.filter((skill) => !userSet.has(skill.toLowerCase())), score: Math.round(matched.length / required.length * 100) };
}

export async function getUserSkills(login) {
  const repos = await repository.getRepos(login);
  const repositoryLanguages = repos.flatMap((repo) => [
    ...Object.keys(repo.languages || {}),
    repo.primary_language || repo.primaryLanguage || ''
  ]);
  const evidence = repos.flatMap((repo) => [
    ...(repo.topics || []),
    repo.description || ''
  ]).join('\n');
  const exactLanguages = new Set(repositoryLanguages.map((language) => language.toLowerCase()));
  const fromLanguages = Object.keys(skills).filter((canonical) => exactLanguages.has(canonical.toLowerCase()));
  return [...new Set([...fromLanguages, ...extractSkills(evidence)])];
}

export async function analyzeCompatibility(login, jobDescription) {
  await ensureProfile(login);
  const required = extractSkills(jobDescription);
  const userSkills = await getUserSkills(login);
  const result = computeScore(required, userSkills);
  await repository.setSetting(login, 'jobDescription', jobDescription);
  const saved = await repository.saveAnalysis(login, { jobText: jobDescription, required, ...result });
  return { ...result, required, userSkills, analysisId: saved.id };
}

export async function latestCompatibility(login) {
  const latest = await repository.latestAnalysis(login);
  if (!latest) throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'No compatibility analysis is available yet.');
  return latest;
}
