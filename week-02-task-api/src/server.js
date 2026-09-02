import { createApp } from './app.js';
const port = Number(process.env.PORT || 3000);
createApp().listen(port, () => console.log(`Task API: http://localhost:${port} · Swagger: http://localhost:${port}/docs`));
