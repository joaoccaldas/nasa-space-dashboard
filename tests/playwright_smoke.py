from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright
import json, sys

ROOT=Path(__file__).resolve().parents[1]
def join_groups(names):
    return ''.join(
        file.read_text()
        for name in names
        for file in sorted((ROOT/'parts'/name).glob('*.txt'))
    )
html='<html><head><link rel="manifest" href="manifest.webmanifest"><style>'+join_groups(['c1','c2','c3'])+'</style></head><body>'+join_groups(['h1','h2'])+'</body></html>'
data=join_groups(['d1','d2'])
app=join_groups(['a1','a2','a3','a4'])
css='' 
for name in ['logo.svg','hero-orbit.svg','mission-badge.svg']:
    svg=(ROOT/'assets'/name).read_text()
    html=html.replace(f'assets/{name}','data:image/svg+xml;charset=utf-8,'+quote(svg))

MOCK_INIT=r'''
(() => {
  const store = new Map();
  Object.defineProperty(window,'localStorage',{configurable:true,value:{
    getItem:k=>store.has(k)?store.get(k):null,
    setItem:(k,v)=>store.set(k,String(v)),
    removeItem:k=>store.delete(k),
    clear:()=>store.clear(),
    key:i=>[...store.keys()][i]||null,
    get length(){return store.size}
  }});
  Object.defineProperty(navigator,'onLine',{configurable:true,get:()=>true});
  const apod={title:'Mock Galaxy Bloom',date:'2026-06-18',explanation:'A mock astronomy picture used to validate CaldaSpace rendering and trusted data states.',media_type:'image',url:'https://mock.nasa.test/apod.jpg',hdurl:'https://mock.nasa.test/apod.jpg'};
  const news={results:[
    {title:'A lunar science update',summary:'Scientists prepare a new instrument for lunar exploration.',news_site:'NASA',published_at:'2026-06-18T08:00:00Z',url:'https://www.nasa.gov/'},
    {title:'A telescope sees deeper',summary:'A new observation reveals a distant galaxy in greater detail.',news_site:'ESA',published_at:'2026-06-17T08:00:00Z',url:'https://www.esa.int/'},
    {title:'A mission reaches a milestone',summary:'Engineers complete a major mission test.',news_site:'JPL',published_at:'2026-06-16T08:00:00Z',url:'https://www.jpl.nasa.gov/'}
  ]};
  const images={collection:{items:[
    {href:'https://images.nasa.gov/details-MOCK1',data:[{nasa_id:'MOCK1',title:'Saturn in sunlight',description:'A validation image of Saturn.',date_created:'2026-01-01T00:00:00Z'}],links:[{href:'https://mock.nasa.test/saturn.jpg',render:'image'}]},
    {href:'https://images.nasa.gov/details-MOCK2',data:[{nasa_id:'MOCK2',title:'A nebula nursery',description:'A validation image of a stellar nursery.',date_created:'2026-01-02T00:00:00Z'}],links:[{href:'https://mock.nasa.test/nebula.jpg',render:'image'}]}
  ]}};
  const neo={element_count:2,near_earth_objects:{'2026-06-19':[
    {name:'(2026 QA)',is_potentially_hazardous_asteroid:false,estimated_diameter:{meters:{estimated_diameter_min:20,estimated_diameter_max:45}},close_approach_data:[{close_approach_date:'2026-06-19',miss_distance:{kilometers:'4500000'},relative_velocity:{kilometers_per_second:'12.4'}}]},
    {name:'(2026 QB)',is_potentially_hazardous_asteroid:true,estimated_diameter:{meters:{estimated_diameter_min:80,estimated_diameter_max:150}},close_approach_data:[{close_approach_date:'2026-06-20',miss_distance:{kilometers:'8200000'},relative_velocity:{kilometers_per_second:'18.1'}}]}
  ]}};
  window.fetch=async input=>{
    const url=String(input);
    let body;
    if(url.includes('/planetary/apod')) body=apod;
    else if(url.includes('spaceflightnewsapi')) body=news;
    else if(url.includes('images-api.nasa.gov')) body=images;
    else if(url.includes('/neo/rest/')) body=neo;
    else throw new Error('Unexpected mock URL '+url);
    return new Response(JSON.stringify(body),{status:200,headers:{'Content-Type':'application/json'}});
  };
})();
'''

html=html.replace('</body>',f'<script>{MOCK_INIT}</script><script>{data}</script><script>{app}</script></body>')

PLACEHOLDER=(ROOT/'assets'/'hero-orbit.svg').read_bytes()

checks=[]
def check(name, condition, detail=''):
    checks.append((name,bool(condition),detail))
    print(('PASS' if condition else 'FAIL'),name,detail)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-breakpad'])
    context=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1)
    page=context.new_page()
    page.route('https://mock.nasa.test/**',lambda route: route.fulfill(status=200,body=PLACEHOLDER,headers={'Content-Type':'image/svg+xml'}))
    page_errors=[]
    page.on('pageerror',lambda err: page_errors.append(str(err)))
    page.set_content(html,wait_until='domcontentloaded',timeout=20000)
    page.wait_for_timeout(1000)

    check('No runtime page errors',not page_errors,'; '.join(page_errors))
    check('Five routed views',page.locator('.view').count()==5)
    check('Single active view',page.locator('.view.active').count()==1)
    check('Home hero visible','universe is bigger' in page.locator('#homeTitle').inner_text().lower())
    check('APOD live card rendered',page.locator('#apodCard h3').inner_text()=='Mock Galaxy Bloom')
    check('News cards rendered',page.locator('#newsCards .news-card').count()==3)
    check('Mobile nav has five destinations',page.locator('.mobile-nav button').count()==5)

    page.locator('.mobile-nav [data-route="discover"]').click()
    page.wait_for_timeout(100)
    check('Discover route works',page.locator('#discover').evaluate('e=>e.classList.contains("active")'))
    page.locator('#imageSearch').fill('Saturn')
    page.locator('#imageSearchButton').click()
    page.wait_for_timeout(200)
    check('NASA image results rendered',page.locator('#imageGrid .media-card').count()==2)
    page.locator('#imageGrid .save-inline').first.click()
    check('Save count increments',page.locator('#savedCount').inner_text()=='1')
    page.locator('#savedOpen').click()
    check('Saved library opens',page.locator('#savedDialog').evaluate('e=>e.open'))
    check('Saved item rendered',page.locator('#savedGrid .saved-item').count()==1)
    page.locator('#savedClose').click()

    page.locator('.mobile-nav [data-route="learn"]').click()
    check('Learn route works',page.locator('#learn').evaluate('e=>e.classList.contains("active")'))
    check('Eight learning cards',page.locator('#knowledgeGrid .knowledge-card').count()==8)
    page.locator('[data-depth="deep"]').click()
    check('Depth switch works',page.locator('[data-depth="deep"]').evaluate('e=>e.classList.contains("active")'))
    page.locator('#knowledgeGrid .knowledge-card').first.click()
    check('Learning awards XP',int(page.locator('#progressXp').inner_text())>=5)
    check('Six evidence cards',page.locator('#theoryGrid .theory-card').count()==6)

    page.locator('.mobile-nav [data-route="observe"]').click()
    page.wait_for_timeout(100)
    check('Observe route works',page.locator('#observe').evaluate('e=>e.classList.contains("active")'))
    check('NEO cards rendered',page.locator('#neoGrid .object-card').count()==2)

    page.locator('.mobile-nav [data-route="play"]').click()
    check('Play route works',page.locator('#play').evaluate('e=>e.classList.contains("active")'))
    qtext=page.locator('.quiz-question').inner_text()
    qdata=page.evaluate('(q)=>window.CALDASPACE_DATA.quiz.find(x=>x.q===q)',qtext)
    page.locator('.answer').nth(qdata['correct']).click()
    check('Correct quiz state displayed',page.locator('.answer.correct').count()==1)
    check('Transit canvas is keyboard focusable',page.locator('#transitCanvas').get_attribute('tabindex')=='0')
    page.locator('#transitCanvas').focus(); page.keyboard.press('ArrowLeft'); page.keyboard.press('Enter')
    check('Transit status responds',len(page.locator('#transitFeedback').inner_text())>10)
    check('Achievement grid rendered',page.locator('#achievementGrid .achievement').count()==8)

    page.locator('#profileOpen').click()
    check('Profile dialog opens',page.locator('#profileDialog').evaluate('e=>e.open'))
    page.locator('#addProfile').click()
    check('Second profile added',page.locator('#profileList .profile-choice').count()==2)
    page.locator('#profileName').fill('Nova')
    page.locator('#profileForm button[value="save"]').click()
    check('Profile name updates',page.locator('#activeName').inner_text()=='Nova')

    check('Skip link present',page.locator('.skip-link').count()==1)
    check('Every view has labelled H1',page.locator('.view h1').count()==5)
    check('Dialogs have labels',page.locator('dialog[aria-labelledby]').count()==4)
    check('All content images have alt attributes',page.locator('img:not([alt])').count()==0)
    check('No inline onclick handlers',page.locator('[onclick]').count()==0)
    check('Install manifest linked',page.locator('link[rel="manifest"]').count()==1)

    page.screenshot(path='/tmp/caldaspace-mobile-tested.png',full_page=True)
    context.close()

    desktop=browser.new_context(viewport={'width':1440,'height':1000})
    p2=desktop.new_page(); p2.route('https://mock.nasa.test/**',lambda route: route.fulfill(status=200,body=PLACEHOLDER,headers={'Content-Type':'image/svg+xml'})); p2.set_content(html,wait_until='domcontentloaded'); p2.wait_for_timeout(700)
    check('Desktop navigation visible',p2.locator('.desktop-nav').evaluate('e=>getComputedStyle(e).display')=='flex')
    check('Desktop mobile nav hidden',p2.locator('.mobile-nav').evaluate('e=>getComputedStyle(e).display')=='none')
    p2.screenshot(path='/tmp/caldaspace-desktop-tested.png',full_page=True)
    desktop.close(); browser.close()

failed=[name for name,ok,_ in checks if not ok]
print(f'\n{len(checks)-len(failed)}/{len(checks)} checks passed')
if failed:
    print('Failed:',failed)
    sys.exit(1)
