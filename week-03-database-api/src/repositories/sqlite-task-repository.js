import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

export class SqliteTaskRepository {
  constructor(filename = './data/tasks.db') {
    if (filename !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(filename)), { recursive: true });
    this.db = new Database(filename);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(trim(title)) > 0),
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`);
    const count = this.db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;
    if (count === 0) {
      const insert = this.db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
      const seed = this.db.transaction(() => {
        insert.run('Learn persistent storage', 1);
        insert.run('Keep the API contract stable', 0);
        insert.run('Prove restart persistence', 0);
      });
      seed();
    }
  }
  map(row) { return row && { ...row, done: Boolean(row.done) }; }
  async all({ done, search } = {}) {
    const where = []; const params = {};
    if (done !== undefined) { where.push('done = @done'); params.done = done ? 1 : 0; }
    if (search) { where.push('title LIKE @search'); params.search = `%${search}%`; }
    const sql = `SELECT * FROM tasks ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY id`;
    return this.db.prepare(sql).all(params).map((row) => this.map(row));
  }
  async find(id) { return this.map(this.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id)); }
  async create(title) { const result = this.db.prepare('INSERT INTO tasks (title) VALUES (?)').run(title); return this.find(Number(result.lastInsertRowid)); }
  async update(id, changes) {
    const task = await this.find(id); if (!task) return null;
    this.db.prepare('UPDATE tasks SET title = ?, done = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(changes.title ?? task.title, (changes.done ?? task.done) ? 1 : 0, id);
    return this.find(id);
  }
  async delete(id) { return this.db.prepare('DELETE FROM tasks WHERE id = ?').run(id).changes > 0; }
  async stats() { const row = this.db.prepare('SELECT COUNT(*) total, SUM(CASE WHEN done = 1 THEN 1 ELSE 0 END) done FROM tasks').get(); return { total: row.total, done: row.done, open: row.total - row.done }; }
  close() { this.db.close(); }
}
