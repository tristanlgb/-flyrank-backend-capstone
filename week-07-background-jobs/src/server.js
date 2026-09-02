import {createApp} from './app.js';const port=Number(process.env.PORT||3004);createApp().listen(port,()=>console.log(`Jobs API: http://localhost:${port} · Inngest: /api/inngest`));
