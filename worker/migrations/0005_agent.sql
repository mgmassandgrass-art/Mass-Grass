-- Site files edited by the admin agent: a draft (preview only) and the published copy served to everyone.
CREATE TABLE site_files (path TEXT PRIMARY KEY, draft TEXT, published TEXT, deleted INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL);
CREATE TABLE site_file_versions (id INTEGER PRIMARY KEY AUTOINCREMENT, path TEXT NOT NULL, content TEXT, note TEXT, created_at INTEGER NOT NULL);
CREATE INDEX site_file_versions_path ON site_file_versions(path, id);
CREATE TABLE agent_threads (id TEXT PRIMARY KEY, title TEXT NOT NULL DEFAULT '', messages TEXT NOT NULL DEFAULT '[]', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE agent_log (id INTEGER PRIMARY KEY AUTOINCREMENT, thread_id TEXT, tool TEXT NOT NULL, input TEXT, result TEXT, created_at INTEGER NOT NULL);
ALTER TABLE images ADD COLUMN name TEXT NOT NULL DEFAULT '';
ALTER TABLE images ADD COLUMN note TEXT NOT NULL DEFAULT '';
