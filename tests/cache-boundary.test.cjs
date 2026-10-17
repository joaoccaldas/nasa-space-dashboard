const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const ctx=vm.createContext({URL,self:{registration:{scope:'https://example.test/nasa-space-dashboard/'},addEventListener(){}}});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../service-worker.js'),'utf8'),ctx);
const allowed=(url,method='GET')=>vm.runInContext(`cacheable(${JSON.stringify({url,method})})`,ctx);
test('cache accepts only application static files without a query',()=>{
  assert.equal(allowed('https://example.test/nasa-space-dashboard/parts/a3/09.txt'),true);
  assert.equal(allowed('https://example.test/nasa-space-dashboard/transit-model.js'),true);
  for(const url of [
    'https://api.nasa.gov/planetary/apod?api_key=TEST_ONLY',
    'https://example.test/nasa-space-dashboard/index.html?api_key=TEST_ONLY',
    'https://example.test/another-app/index.html',
    'https://example.test/nasa-space-dashboard/private.json',
    'https://third-party.test/image.jpg',
  ])assert.equal(allowed(url),false,url);
  assert.equal(allowed('https://example.test/nasa-space-dashboard/index.html','POST'),false);
});
