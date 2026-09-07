import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const bootstrap=readFileSync(new URL('../bootstrap.js',import.meta.url),'utf8');
const paths=[...bootstrap.match(/app:\[([^\]]+)\]/)[1].matchAll(/'([^']+)'/g)].map(m=>m[1]);
const app=paths.map(p=>readFileSync(new URL('../'+p,import.meta.url),'utf8')).join('');
new vm.Script(app);
const news=app.slice(app.indexOf('async function loadNews('),app.indexOf('let searchController;'));
function node(){return {textContent:'',innerHTML:'',children:[],replaceChildren(...x){this.children=x;}};}
for(const mode of ['offline','failed','cached','live']) test('news labels '+mode+' accurately',async()=>{
 const nodes=new Map();const items=[{title:'Fixture article',url:'https://example.com',published_at:'2026-09-07'}];
 const context={document:{createElement:node},navigator:{onLine:mode!=='offline'},DATA:{fallbackNews:items},
 $:(q,el)=>{if(el)return node();if(!nodes.has(q))nodes.set(q,node());return nodes.get(q);},
 getCache:()=>mode==='cached'?[...items]:null,setCache:()=>{},safeText:x=>x||'',safeUrl:x=>x,timeAgo:x=>x,
 fetchJSON:async()=>{if(mode==='failed')throw Error('offline');return {results:[...items]};},Intl,Date};
 vm.createContext(context);vm.runInContext(news+';globalThis.run=loadNews;',context);await context.run();
 const status=nodes.get('#newsFreshness').textContent;
 assert.match(status,mode==='cached'?/Cached/:mode==='live'?/Updated/:/Offline fallback/);
 const card=nodes.get('#newsCards').children[0].innerHTML;
 assert.match(card,mode==='cached'?/Cached news/:mode==='live'?/Live news/:/Offline source collection/);
});
test('service worker leaves external feeds to network and app cache expiry',()=>{
 const listeners={};let intercepted=false;
 const context={self:{location:{origin:'https://portfolio.example'},addEventListener:(n,f)=>listeners[n]=f},URL};
 vm.runInNewContext(readFileSync(new URL('../service-worker.js',import.meta.url),'utf8'),context);
 listeners.fetch({request:{method:'GET',url:'https://api.nasa.gov/planetary/apod'},respondWith:()=>intercepted=true});
 assert.equal(intercepted,false);
});
