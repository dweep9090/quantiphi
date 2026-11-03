export function createPgRepository(pool) {
  const normalizeAnalysis = (row) => row && ({
    id: row.id,
    jobText: row.job_text,
    required: row.required_skills,
    matched: row.matched_skills,
    missing: row.missing_skills,
    score: Number(row.score),
    createdAt: row.createdAt || row.created_at
  });
  return {
    kind: 'postgres',
    getUser: async (login) => {
      const { rows } = await pool.query('SELECT * FROM users WHERE github_login=$1', [login.toLowerCase()]);
      return rows[0] || null;
    },
    saveProfile: async (p, repositories) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query(
          `INSERT INTO users (github_login,name,avatar_url,bio,company,location,blog,html_url,followers,following,public_repos,total_stars,account_created,fetched_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,now())
           ON CONFLICT (github_login) DO UPDATE SET name=EXCLUDED.name,avatar_url=EXCLUDED.avatar_url,bio=EXCLUDED.bio,company=EXCLUDED.company,location=EXCLUDED.location,blog=EXCLUDED.blog,html_url=EXCLUDED.html_url,followers=EXCLUDED.followers,following=EXCLUDED.following,public_repos=EXCLUDED.public_repos,total_stars=EXCLUDED.total_stars,account_created=EXCLUDED.account_created,fetched_at=now()
           RETURNING *`,
          [p.login.toLowerCase(), p.name, p.avatarUrl, p.bio, p.company, p.location, p.blog, p.htmlUrl, p.followers, p.following, p.publicRepos, p.totalStars, p.accountCreated]
        );
        const user = rows[0];
        for (const r of repositories) {
          const result = await client.query(
            `INSERT INTO repositories (user_id,github_id,name,description,stars,forks,primary_language,topics,html_url,is_fork,pushed_at,fetched_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,now())
             ON CONFLICT (user_id,github_id) DO UPDATE SET name=EXCLUDED.name,description=EXCLUDED.description,stars=EXCLUDED.stars,forks=EXCLUDED.forks,primary_language=EXCLUDED.primary_language,topics=EXCLUDED.topics,html_url=EXCLUDED.html_url,is_fork=EXCLUDED.is_fork,pushed_at=EXCLUDED.pushed_at,fetched_at=now()
             RETURNING id`,
            [user.id, r.githubId, r.name, r.description, r.stars, r.forks, r.primaryLanguage, r.topics, r.htmlUrl, r.isFork, r.pushedAt]
          );
          await client.query('DELETE FROM repo_languages WHERE repo_id=$1', [result.rows[0].id]);
          for (const [language, bytes] of Object.entries(r.languages || {})) {
            await client.query('INSERT INTO repo_languages (repo_id,language,bytes) VALUES ($1,$2,$3)', [result.rows[0].id, language, bytes]);
          }
        }
        await client.query('DELETE FROM repositories WHERE user_id=$1 AND NOT (github_id = ANY($2::bigint[]))', [user.id, repositories.map((repo) => String(repo.githubId))]);
        await client.query('COMMIT');
        return user;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    getRepos: async (login) => {
      const { rows } = await pool.query(
        `SELECT r.*, COALESCE(json_object_agg(l.language,l.bytes) FILTER (WHERE l.language IS NOT NULL),'{}') AS languages
         FROM repositories r JOIN users u ON u.id=r.user_id LEFT JOIN repo_languages l ON l.repo_id=r.id
         WHERE u.github_login=$1 GROUP BY r.id ORDER BY r.stars DESC`, [login.toLowerCase()]
      );
      return rows;
    },
    getLanguages: async (login) => {
      const { rows } = await pool.query(
        `SELECT l.language,SUM(l.bytes)::bigint AS bytes FROM repo_languages l JOIN repositories r ON r.id=l.repo_id JOIN users u ON u.id=r.user_id
         WHERE u.github_login=$1 GROUP BY l.language`, [login.toLowerCase()]
      );
      return Object.fromEntries(rows.map((r) => [r.language, Number(r.bytes)]));
    },
    getContributions: async (login) => {
      const { rows } = await pool.query(
        'SELECT c.date,c.count,c.level FROM contributions c JOIN users u ON u.id=c.user_id WHERE u.github_login=$1 ORDER BY c.date', [login.toLowerCase()]
      );
      return rows.length ? rows.map((r) => ({ date: String(r.date).slice(0, 10), count: r.count, level: r.level })) : null;
    },
    saveContributions: async (login, data) => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const { rows } = await client.query('SELECT id FROM users WHERE github_login=$1', [login.toLowerCase()]);
        if (!rows[0]) {
          await client.query('COMMIT');
          return;
        }
        const id = rows[0].id;
        for (const day of data.days) {
          await client.query('INSERT INTO contributions (user_id,date,count,level) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id,date) DO UPDATE SET count=EXCLUDED.count,level=EXCLUDED.level', [id, day.date, day.count, day.level]);
        }
        await client.query('UPDATE users SET contrib_fetched_at=now() WHERE id=$1', [id]);
        await client.query('COMMIT');
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    },
    saveAnalysis: async (login, a) => {
      const { rows } = await pool.query(
        `INSERT INTO job_analyses (user_id,job_text,required_skills,matched_skills,missing_skills,score)
         SELECT id,$2,$3,$4,$5,$6 FROM users WHERE github_login=$1 RETURNING *`,
        [login.toLowerCase(), a.jobText, JSON.stringify(a.required), JSON.stringify(a.matched), JSON.stringify(a.missing), a.score]
      );
      return normalizeAnalysis(rows[0]);
    },
    latestAnalysis: async (login) => {
      const { rows } = await pool.query(
        `SELECT a.id,a.job_text,a.required_skills,a.matched_skills,a.missing_skills,a.score,a.created_at AS "createdAt"
         FROM job_analyses a JOIN users u ON u.id=a.user_id WHERE u.github_login=$1 ORDER BY a.created_at DESC LIMIT 1`, [login.toLowerCase()]
      );
      return normalizeAnalysis(rows[0]);
    },
    getAnalysis: async (login, id) => {
      const { rows } = await pool.query('SELECT a.* FROM job_analyses a JOIN users u ON u.id=a.user_id WHERE u.github_login=$1 AND a.id=$2', [login.toLowerCase(), id]);
      return normalizeAnalysis(rows[0]);
    },
    addMessage: async (login, role, content) => {
      await pool.query('INSERT INTO chat_messages (user_id,role,content) SELECT id,$2,$3 FROM users WHERE github_login=$1', [login.toLowerCase(), role, content]);
    },
    getMessages: async (login, limit = 30) => {
      const { rows } = await pool.query('SELECT m.role,m.content,m.created_at AS "createdAt" FROM chat_messages m JOIN users u ON u.id=m.user_id WHERE u.github_login=$1 ORDER BY m.created_at DESC LIMIT $2', [login.toLowerCase(), limit]);
      return rows.reverse();
    },
    getSetting: async (login, key) => {
      const { rows } = await pool.query('SELECT s.value FROM user_settings s JOIN users u ON u.id=s.user_id WHERE u.github_login=$1 AND s.key=$2', [login.toLowerCase(), key]);
      return rows[0]?.value ?? null;
    },
    setSetting: async (login, key, value) => {
      await pool.query('INSERT INTO user_settings (user_id,key,value) SELECT id,$2,$3::jsonb FROM users WHERE github_login=$1 ON CONFLICT (user_id,key) DO UPDATE SET value=EXCLUDED.value', [login.toLowerCase(), key, JSON.stringify(value)]);
    }
  };
}
