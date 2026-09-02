import 'dotenv/config';
import { createApp } from './app.js';
import { SqliteTaskRepository } from './repositories/sqlite-task-repository.js';
import { PostgresTaskRepository } from './repositories/postgres-task-repository.js';

const driver = process.env.DB_DRIVER || 'sqlite';
const repository = driver === 'postgres' ? new PostgresTaskRepository(process.env.DATABASE_URL) : new SqliteTaskRepository(process.env.SQLITE_PATH || './data/tasks.db');
const port = Number(process.env.PORT || 3001);
createApp(repository).listen(port, () => console.log(`Persistent Task API (${driver}): http://localhost:${port} · Swagger: /docs`));
