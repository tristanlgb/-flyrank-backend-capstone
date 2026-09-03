import assert from 'node:assert/strict';
const json = async (url, options) => { const response = await fetch(url, options); const body = await response.json(); return { response, body }; };
const post = body => ({ method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body) });
async function poll(url, terminal, timeout=20000) { const end=Date.now()+timeout; while(Date.now()<end){const result=await json(url);if(terminal.includes(result.body.status))return result.body;await new Promise(resolve=>setTimeout(resolve,500));}throw new Error(`Timed out polling ${url}`); }

const llm=await json('http://localhost:3003/ai/enrich-book',post({title:'Learning Node',description:'A practical JavaScript backend guide',price:24,rating:5}));assert.equal(llm.response.status,200);assert.equal(llm.body.data.category,'technology');console.log('PASS Week 6 structured LLM response');
const invalid=await json('http://localhost:3003/ai/enrich-book',post({}));assert.equal(invalid.response.status,400);console.log('PASS Week 6 rejects invalid input');

const job=await json('http://localhost:3004/reports',post({topic:'cats'}));assert.equal(job.response.status,202);const done=await poll(`http://localhost:3004/reports/${job.body.id}`,['done','failed']);assert.equal(done.status,'done');console.log('PASS background job pending -> done');

const report=await json('http://localhost:3005/reports',post({force:true}));assert.equal(report.response.status,201);const file=await fetch(`http://localhost:3005${report.body.file}`);assert.equal(file.status,200);assert.match(file.headers.get('content-type')||'',/application\/pdf/);assert.ok((await file.arrayBuffer()).byteLength>10000);console.log('PASS generated downloadable PDF');

const graph={input:'I need help with a broken invoice',nodes:[{id:'start',data:{label:'Classify',prompt:'Is this a support request?'}},{id:'support',data:{label:'Support',prompt:'Is this issue urgent?'}}],edges:[{source:'start',target:'support',label:'YES'}]};const run=await json('http://localhost:3007/api/runs',post(graph));assert.equal(run.response.status,202);const runDone=await poll(`http://localhost:3007/api/runs/${run.body.id}`,['done','failed']);assert.equal(runDone.status,'done');assert.deepEqual(runDone.order.map(item=>item.nodeId),['start','support']);console.log('PASS visual workflow dynamically traverses YES edge');
console.log('All Week 6-7 smoke checks passed.');
