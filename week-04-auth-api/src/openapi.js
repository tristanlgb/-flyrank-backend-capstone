const credentials = { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', minLength: 6 } } };
export const openapi = {
  openapi: '3.0.3', info: { title: 'Supabase Auth API', version: '1.0.0' }, servers: [{ url: 'http://localhost:3002' }],
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }, schemas: { Credentials: credentials } },
  paths: {
    '/auth/signup': { post: { summary: 'Create account', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } }, responses: { 201: { description: 'Created' }, 400: { description: 'Invalid input' } } } },
    '/auth/login': { post: { summary: 'Login and receive tokens', requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Credentials' } } } }, responses: { 200: { description: 'Authenticated' }, 400: { description: 'Invalid input' }, 401: { description: 'Invalid credentials' } } } },
    '/auth/logout': { post: { summary: 'Log out', security: [{ bearerAuth: [] }], responses: { 204: { description: 'Logged out' }, 401: { description: 'Unauthorized' } } } },
    '/public/info': { get: { summary: 'Public information', responses: { 200: { description: 'Public response' } } } },
    '/protected/profile': { get: { summary: 'Current profile', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Profile' }, 401: { description: 'Unauthorized' } } } },
    '/protected/dashboard': { get: { summary: 'Protected dashboard', security: [{ bearerAuth: [] }], responses: { 200: { description: 'Dashboard' }, 401: { description: 'Unauthorized' } } } }
  }
};
