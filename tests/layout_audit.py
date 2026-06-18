from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
import sys
root=Path(__file__).resolve().parents[1]
ROOT=root
def join_groups(names):
    return ''.join(
        file.read_text()
        for name in names
        for file in sorted((ROOT/'parts'/name).glob('*.txt'))
    )
css=join_groups(['c1','c2','c3']); body=join_groups(['h1','h2']); data=join_groups(['d1','d2']); app=join_groups(['a1','a2','a3','a4']); html=f'<html><head><style>{css}</style></head><body>{body}<script>{data}</script><script>{app}</script></body></html>'
for n in ['logo.svg','hero-orbit.svg','mission-badge.svg']:
    html=html.replace(f'assets/{n}','data:image/svg+xml;charset=utf-8,'+quote((root/'assets'/n).read_text()))
results=[]
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    for width,height in [(320,720),(390,844),(768,1024),(1440,1000)]:
        page=browser.new_page(viewport={'width':width,'height':height})
        page.set_content(html,wait_until='domcontentloaded');page.wait_for_timeout(300)
        page.eval_on_selector('#offlineBanner','e=>e.hidden=true')
        overflow=page.evaluate('document.documentElement.scrollWidth-window.innerWidth')
        bad=[]
        for route in ['home','discover','learn','observe','play']:
            page.eval_on_selector(f'[data-route="{route}"]','e=>e.click()')
            page.wait_for_timeout(30)
            found=page.evaluate('''()=>[...document.querySelectorAll('button,a.button,a.source-link')].filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&r.width>0&&r.height>0&&(r.height<40||r.width<40)}).map(e=>({text:e.textContent.trim().slice(0,40),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height)}))''')
            bad.extend(found)
        unique=[]
        for item in bad:
            if item not in unique: unique.append(item)
        results.append((width,overflow,unique))
        print(width,'overflow',overflow,'small targets',unique[:8])
        page.close()
    browser.close()
failed=[r for r in results if r[1]>1 or r[2]]
if failed: sys.exit(1)
