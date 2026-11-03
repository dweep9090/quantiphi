export function createMemoryRepository() {
  const users = new Map();
  const repos = new Map();
  const analyses = new Map();
  const chats = new Map();
  const settings = new Map();
  let nextAnalysisId = 1;
  return {
    kind: 'memory',
    getUser: async (login) => users.get(login.toLowerCase()) || null,
    saveProfile: async (profile, repositories) => {
      const login = profile.login.toLowerCase();
      const previous = users.get(login) || {};
      const user = { ...previous, ...profile, fetchedAt: new Date().toISOString(), id: login };
      users.set(login, user);
      repos.set(login, repositories.map((repo) => ({ ...repo, languages: repo.languages || {} })));
      return user;
    },
    getRepos: async (login) => repos.get(login.toLowerCase()) || [],
    getLanguages: async (login) => {
      const totals = {};
      for (const repo of repos.get(login.toLowerCase()) || []) {
        for (const [language, bytes] of Object.entries(repo.languages || {})) totals[language] = (totals[language] || 0) + bytes;
      }
      return totals;
    },
    getContributions: async (login) => users.get(login.toLowerCase())?.contributions || null,
    saveContributions: async (login, data) => {
      const user = users.get(login.toLowerCase());
      if (user) users.set(login.toLowerCase(), { ...user, contributions: data.days, contribFetchedAt: new Date().toISOString() });
    },
    saveAnalysis: async (login, analysis) => {
      const row = { ...analysis, id: nextAnalysisId++, createdAt: new Date().toISOString() };
      const rows = analyses.get(login.toLowerCase()) || [];
      rows.unshift(row);
      analyses.set(login.toLowerCase(), rows);
      return row;
    },
    latestAnalysis: async (login) => (analyses.get(login.toLowerCase()) || [])[0] || null,
    getAnalysis: async (login, id) => (analyses.get(login.toLowerCase()) || []).find((row) => row.id === id) || null,
    addMessage: async (login, role, content) => {
      const rows = chats.get(login.toLowerCase()) || [];
      rows.push({ role, content, createdAt: new Date().toISOString() });
      chats.set(login.toLowerCase(), rows);
    },
    getMessages: async (login, limit = 30) => (chats.get(login.toLowerCase()) || []).slice(-limit),
    getSetting: async (login, key) => settings.get(`${login.toLowerCase()}:${key}`) ?? null,
    setSetting: async (login, key, value) => settings.set(`${login.toLowerCase()}:${key}`, value)
  };
}
