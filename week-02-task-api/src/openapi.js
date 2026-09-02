export const openapi = {
  openapi: '3.0.3',
  info: { title: 'Task API', version: '1.0.0', description: 'In-memory CRUD API for FlyRank Week 2' },
  servers: [{ url: 'http://localhost:3000' }],
  components: { schemas: {
    Task: { type: 'object', required: ['id', 'title', 'done'], properties: { id: { type: 'integer' }, title: { type: 'string' }, done: { type: 'boolean' } } },
    TaskInput: { type: 'object', properties: { title: { type: 'string' }, done: { type: 'boolean' } } },
    Error: { type: 'object', properties: { error: { type: 'string' } } }
  } },
  paths: {
    '/': { get: { summary: 'Describe the API', responses: { 200: { description: 'API metadata' } } } },
    '/health': { get: { summary: 'Health check', responses: { 200: { description: 'Healthy' } } } },
    '/tasks': {
      get: { summary: 'List tasks', parameters: [{ in: 'query', name: 'done', schema: { type: 'boolean' } }, { in: 'query', name: 'search', schema: { type: 'string' } }], responses: { 200: { description: 'Task list' } } },
      post: { summary: 'Create task', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } }, responses: { 201: { description: 'Created' }, 400: { description: 'Invalid input' } } }
    },
    '/tasks/{id}': {
      parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' } }],
      get: { summary: 'Get one task', responses: { 200: { description: 'Task' }, 404: { description: 'Not found' } } },
      put: { summary: 'Update task', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskInput' } } } }, responses: { 200: { description: 'Updated' }, 400: { description: 'Invalid input' }, 404: { description: 'Not found' } } },
      delete: { summary: 'Delete task', responses: { 204: { description: 'Deleted' }, 404: { description: 'Not found' } } }
    },
    '/stats': { get: { summary: 'Task statistics', responses: { 200: { description: 'Counts' } } } },
    '/reset': { post: { summary: 'Restore seed data', responses: { 200: { description: 'Reset complete' } } } }
  }
};
