(() => {
  const PARTS = {"html":["parts/h1/01.txt","parts/h1/02.txt","parts/h1/03.txt","parts/h2/04.txt","parts/h2/05.txt","parts/h2/06.txt"],"css":["parts/c1/01.txt","parts/c1/02.txt","parts/c1/03.txt","parts/c2/04.txt","parts/c2/05.txt","parts/c2/06.txt","parts/c3/07.txt","parts/c3/08.txt","parts/c3/09.txt"],"data":["parts/d1/01.txt","parts/d1/02.txt","parts/d2/03.txt","parts/d2/04.txt"],"app":["parts/a1/01.txt","parts/a1/02.txt","parts/a1/03.txt","parts/a2/04.txt","parts/a2/05.txt","parts/a2/06.txt","parts/a3/07.txt","parts/a3/08.txt","parts/a3/09.txt","parts/a4/10.txt","parts/a4/11.txt"]};
  const load = paths => Promise.all(paths.map(path => fetch(path).then(r => { if(!r.ok) throw new Error(path); return r.text(); }))).then(parts => parts.join(''));
  Promise.all([load(PARTS.html),load(PARTS.css),load(PARTS.data),load(PARTS.app)]).then(([html,css,data,app]) => {
    const style=document.createElement('style'); style.textContent=css; document.head.append(style);
    document.body.innerHTML=html; Function(data)(); Function(app)();
  }).catch(error => { document.body.innerHTML='<main style="min-height:100vh;display:grid;place-items:center;background:#060817;color:#f8f9ff;font-family:system-ui;padding:24px"><div><h1>CaldaSpace could not launch</h1><p>Refresh the page or reconnect to load the application shell.</p><pre>'+String(error.message)+'</pre></div></main>'; });
})();
