CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, github_login TEXT UNIQUE NOT NULL, name TEXT, avatar_url TEXT, bio TEXT,
  company TEXT, location TEXT, blog TEXT, html_url TEXT, followers INT DEFAULT 0, following INT DEFAULT 0,
  public_repos INT DEFAULT 0, total_stars INT DEFAULT 0, account_created TIMESTAMPTZ,
  fetched_at TIMESTAMPTZ DEFAULT now(), contrib_fetched_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS repositories (
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users ON DELETE CASCADE, github_id BIGINT,
  name TEXT NOT NULL, description TEXT, stars INT DEFAULT 0, forks INT DEFAULT 0,
  primary_language TEXT, topics TEXT[] DEFAULT '{}', html_url TEXT, is_fork BOOLEAN DEFAULT FALSE,
  pushed_at TIMESTAMPTZ, fetched_at TIMESTAMPTZ DEFAULT now(), UNIQUE(user_id, github_id)
);
CREATE INDEX IF NOT EXISTS repositories_user_id_idx ON repositories(user_id);
CREATE TABLE IF NOT EXISTS repo_languages (
  repo_id INT REFERENCES repositories ON DELETE CASCADE, language TEXT, bytes BIGINT,
  PRIMARY KEY(repo_id, language)
);
CREATE TABLE IF NOT EXISTS contributions (
  user_id INT REFERENCES users ON DELETE CASCADE, date DATE, count INT DEFAULT 0, level SMALLINT DEFAULT 0,
  PRIMARY KEY(user_id, date)
);
CREATE TABLE IF NOT EXISTS job_analyses (
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users ON DELETE CASCADE, job_text TEXT,
  required_skills JSONB, matched_skills JSONB, missing_skills JSONB, score NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_analyses_user_created_idx ON job_analyses(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY, user_id INT REFERENCES users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user','assistant')), content TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS chat_messages_user_created_idx ON chat_messages(user_id, created_at);
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INT REFERENCES users ON DELETE CASCADE, key TEXT, value JSONB, PRIMARY KEY(user_id, key)
);
