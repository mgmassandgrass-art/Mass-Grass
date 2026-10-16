CREATE TABLE subscribers (email TEXT PRIMARY KEY, source TEXT NOT NULL DEFAULT 'footer', created_at INTEGER NOT NULL);
