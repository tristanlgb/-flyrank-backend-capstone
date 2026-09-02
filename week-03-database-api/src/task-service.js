export class TaskService {
  constructor(repository) { this.repository = repository; }
  list(filters) { return this.repository.all(filters); }
  get(id) { return this.repository.find(id); }
  create(title) { return this.repository.create(title.trim()); }
  update(id, changes) { return this.repository.update(id, changes); }
  delete(id) { return this.repository.delete(id); }
  stats() { return this.repository.stats(); }
}
