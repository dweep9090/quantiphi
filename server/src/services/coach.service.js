import { z } from 'zod';
import { repository } from '../repositories/index.js';
import { ensureProfile } from './profile.service.js';
import { getUserSkills } from './skill.service.js';
import { generateContent } from './llm.service.js';
import { AppError } from '../utils/AppError.js';

const coachSchema = z.object({
  roadmap: z.array(z.object({ skill: z.string(), steps: z.array(z.string()), estimatedTime: z.string() })),
  projectIdeas: z.array(z.object({ title: z.string(), description: z.string(), skillsCovered: z.array(z.string()), builtOn: z.string() })),
  resumeBullets: z.array(z.object({ repo: z.string(), bullets: z.array(z.string()) }))
});

function fallback(missing, skills, repos) {
  const roadmap = missing.map((skill) => ({
    skill, steps: [`Learn ${skill} fundamentals and core terminology.`, `Build a small, tested ${skill} example.`, `Apply ${skill} in a project and document trade-offs.`],
    estimatedTime: '2-4 weeks'
  }));
  const projectIdeas = missing.length ? [{
    title: `Portfolio project using ${missing.slice(0, 2).join(' and ')}`,
    description: 'Build a deployable app that demonstrates the missing skills through a real user workflow.',
    skillsCovered: missing, builtOn: repos[0]?.name || 'a new repository'
  }] : [];
  const resumeBullets = repos.slice(0, 3).map((repo) => ({
    repo: repo.name, bullets: [`Built and maintained ${repo.name}${repo.primaryLanguage ? ` using ${repo.primaryLanguage}` : ''}${skills.length ? ` alongside ${skills.slice(0, 2).join(' and ')}` : ''}.`]
  }));
  return { roadmap, projectIdeas, resumeBullets };
}

export async function buildPlan(login, analysisId) {
  await ensureProfile(login);
  const analysis = analysisId ? await repository.getAnalysis(login, analysisId) : await repository.latestAnalysis(login);
  if (!analysis) throw new AppError(404, 'ANALYSIS_NOT_FOUND', 'Run a compatibility analysis before requesting a coaching plan.');
  const missing = analysis.missing_skills || analysis.missing || [];
  const [skills, repos] = await Promise.all([getUserSkills(login), repository.getRepos(login)]);
  const briefRepos = repos.slice(0, 5).map((repo) => ({ name: repo.name, primaryLanguage: repo.primary_language || repo.primaryLanguage }));
  if (!missing.length) {
    return { roadmap: [], projectIdeas: [], resumeBullets: fallback([], skills, briefRepos).resumeBullets, message: 'Your profile fully matches the identified skills.' };
  }
  const prompt = `Return JSON only with roadmap:[{skill,steps:[string],estimatedTime}], projectIdeas:[{title,description,skillsCovered:[string],builtOn}], resumeBullets:[{repo,bullets:[string]}]. Missing skills: ${JSON.stringify(missing)}. Existing skills: ${JSON.stringify(skills)}. Repositories: ${JSON.stringify(briefRepos)}`;
  const raw = await generateContent('Create practical, truthful career coaching. Do not claim experience not present in the input.', [{ role: 'user', parts: [{ text: prompt }] }], true);
  if (raw) {
    try {
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*|\s*```$/g, ''));
      return coachSchema.parse(parsed);
    } catch (error) {
      if (error instanceof z.ZodError || error instanceof SyntaxError) {
        return fallback(missing, skills, briefRepos);
      }
      throw error;
    }
  }
  return fallback(missing, skills, briefRepos);
}
