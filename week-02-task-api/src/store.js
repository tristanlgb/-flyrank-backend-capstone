const seed = () => [
  { id: 1, title: 'Learn the request-response loop', done: true },
  { id: 2, title: 'Build CRUD endpoints', done: false },
  { id: 3, title: 'Document the API', done: false }
];

export class MemoryTaskStore {
  constructor() { this.reset(); }
  reset() { this.tasks = seed(); this.nextId = 4; return this.all(); }
  all({ done, search } = {}) {
    return this.tasks.filter((task) =>
      (done === undefined || task.done === done) &&
      (!search || task.title.toLowerCase().includes(search.toLowerCase())));
  }
  find(id) { return this.tasks.find((task) => task.id === id); }
  create(title) { const task = { id: this.nextId++, title, done: false }; this.tasks.push(task); return task; }
  update(id, changes) { const task = this.find(id); if (!task) return null; Object.assign(task, changes); return task; }
  delete(id) { const index = this.tasks.findIndex((task) => task.id === id); if (index < 0) return false; this.tasks.splice(index, 1); return true; }
  stats() { return { total: this.tasks.length, done: this.tasks.filter((task) => task.done).length, open: this.tasks.filter((task) => !task.done).length }; }
}
