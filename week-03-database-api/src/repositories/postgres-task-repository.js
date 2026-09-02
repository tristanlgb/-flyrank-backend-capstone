import pg from 'pg';
const { Pool } = pg;

export class PostgresTaskRepository {
  constructor(connectionString) { this.pool = new Pool({ connectionString }); }
  async all({ done, search } = {}) {
    const conditions = []; const values = [];
    if (done !== undefined) { values.push(done); conditions.push(`done = $${values.length}`); }
    if (search) { values.push(`%${search}%`); conditions.push(`title ILIKE $${values.length}`); }
    const result = await this.pool.query(`SELECT * FROM tasks ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''} ORDER BY id`, values);
    return result.rows;
  }
  async find(id) { return (await this.pool.query('SELECT * FROM tasks WHERE id = $1', [id])).rows[0]; }
  async create(title) { return (await this.pool.query('INSERT INTO tasks(title) VALUES($1) RETURNING *', [title])).rows[0]; }
  async update(id, changes) {
    return (await this.pool.query(`UPDATE tasks SET title = COALESCE($2, title), done = COALESCE($3, done), updated_at = NOW() WHERE id = $1 RETURNING *`, [id, changes.title ?? null, changes.done ?? null])).rows[0];
  }
  async delete(id) { return (await this.pool.query('DELETE FROM tasks WHERE id = $1', [id])).rowCount > 0; }
  async stats() { const row = (await this.pool.query('SELECT COUNT(*)::int total, COUNT(*) FILTER (WHERE done)::int done, COUNT(*) FILTER (WHERE NOT done)::int open FROM tasks')).rows[0]; return row; }
  async close() { await this.pool.end(); }
}
