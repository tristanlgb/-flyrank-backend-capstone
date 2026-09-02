import {createApp} from './app.js'; const port=Number(process.env.PORT||3003); createApp().listen(port,()=>console.log(`LLM API: http://localhost:${port}`));
