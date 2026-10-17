-- Files sold with each product, kept in D1 in 1.5 MB chunks, and a secret per order for download links.
CREATE TABLE product_files (
  id TEXT PRIMARY KEY, kind TEXT NOT NULL, product_id TEXT NOT NULL, name TEXT NOT NULL,
  size INTEGER NOT NULL, type TEXT NOT NULL, chunks INTEGER NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX product_files_p ON product_files(kind, product_id);
CREATE TABLE file_chunks (file_id TEXT NOT NULL, idx INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (file_id, idx));
ALTER TABLE orders ADD COLUMN access TEXT;
