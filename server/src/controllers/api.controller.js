import { repository } from '../repositories/index.js';
import { getProfile, getRepos, getContributions, refreshProfile } from '../services/profile.service.js';
import { analyzeCompatibility, latestCompatibility } from '../services/skill.service.js';
import { askGitHub, chatHistory } from '../services/chat.service.js';
import { buildPlan } from '../services/coach.service.js';

export const health = (_req, res) => res.json({ status: 'ok', storage: repository.kind });
export const profile = async (req, res) => res.json(await getProfile(req.params.username));
export const repos = async (req, res) => res.json(await getRepos(req.params.username, req.validatedQuery.sort, req.validatedQuery.language));
export const contributions = async (req, res) => res.json(await getContributions(req.params.username));
export const refresh = async (req, res) => res.json(await refreshProfile(req.params.username));
export const compatibility = async (req, res) => res.json(await analyzeCompatibility(req.params.username, req.body.jobDescription));
export const latest = async (req, res) => res.json(await latestCompatibility(req.params.username));
export const chat = async (req, res) => res.json(await askGitHub(req.params.username, req.body.message));
export const history = async (req, res) => res.json(await chatHistory(req.params.username));
export const coach = async (req, res) => res.json(await buildPlan(req.params.username, req.body.analysisId));
