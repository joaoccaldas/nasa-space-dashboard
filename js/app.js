// CaldaSpace - Ultimate Space Exploration Application
// Production-ready integration of NASA data with 3D visualizations and news

import {
  fetchAPOD,
  fetchRandomAPOD,
  fetchMarsPhotos,
  fetchLatestMarsPhotos,
  fetchNearEarthObjects,
  fetchComet3ITrajectory,
  fetchNASAAPI,
  validateAPODDate,
  validateAPIKey,
  APOD_START_DATE,
  testAPIConnection,
  getLatestAPODDate,
  getLatestMarsDate,
} from './api.js';
import NEO3DVisualizer from './neo3d.js';
import {
  fetchEnhancedTelescopeData,
  getAvailableMissions,
  getTelescopeStats,
} from './telescope.js';
import {
  fetchNASANews,
  fetchAggregatedSpaceNews,
  formatNewsDate,
  getCategoryEmoji,
} from './news.js';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const safeText = (v) => (v == null ? '' : String(v));

function setLoading(el, isLoading) {
  if (!el) return;
  el.toggleAttribute('aria-busy', !!isLoading);
  el.classList.toggle('is-loading', !!isLoading);
}

function handleError(sectionEl, err, userMsg = 'Something went wrong loading data.') {
  console.error(err);
  if (!sectionEl) return;
  sectionEl.innerHTML = `<div class="error">${safeText(userMsg)}</div>`;
}

async function init() {
  ensureApiKey();
  try {
    if (state.apiKey) { try { validateAPIKey(state.apiKey); } catch {} }
    await testAPIConnection?.(state.apiKey);
  } catch (err) {
    console.warn('API connectivity check failed:', err);
  }

  const missionSel = $('#telescopeMission');
  if (missionSel) {
    missionSel.innerHTML = getAvailableMissions().map(m => `<option value="${safeText(m)}">${safeText(m)}</option>`).join('');
  }

  if ($('#apodAuto')) {
    const out = $('#apodOutput');
    setLoading(out, true);
    try {
      const latest = await getLatestAPODDate?.();
      const data = await fetchAPOD(latest || undefined, state.apiKey);
      renderAPOD(out, data);
    } catch (err) {
      handleError(out, err, 'Failed to load APOD.');
    } finally { setLoading(out, false); }
  }

  if ($('#newsAuto')) {
    await loadNews('nasa');
  }

  bindEvents();
}

const state = {
  apiKey: (window.NASA_API_KEY || localStorage.getItem('NASA_API_KEY') || '').trim(),
  newsCategory: 'nasa',
  newsItems: [],
  neoVisualizer: null,
};

function ensureApiKey() {
  const input = $('#apiKey');
  if (input && input.value.trim()) state.apiKey = input.value.trim();
  if (!state.apiKey) {
    const fromEnv = (window.NASA_API_KEY || '').trim();
    if (fromEnv) state.apiKey = fromEnv;
  }
  localStorage.setItem('NASA_API_KEY', state.apiKey || '');
}

function bindEvents() {
  const apodForm = $('#apodForm');
  if (apodForm) {
    apodForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('#apodOutput');
      setLoading(out, true);
      try {
        ensureApiKey();
        const date = $('#apodDate')?.value || '';
        const validDate = validateAPODDate(date, APOD_START_DATE);
        const data = await fetchAPOD(validDate, state.apiKey);
        renderAPOD(out, data);
      } catch (err) { handleError($('#apodOutput'), err, 'Failed to load APOD.'); }
      finally { setLoading(out, false); }
    });
  }

  $('#apodRandom')?.addEventListener('click', async () => {
    const out = $('#apodOutput');
    setLoading(out, true);
    try { ensureApiKey(); const data = await fetchRandomAPOD(state.apiKey); renderAPOD(out, data); }
    catch (err) { handleError(out, err, 'Failed to load random APOD.'); }
    finally { setLoading(out, false); }
  });

  const marsForm = $('#marsForm');
  if (marsForm) {
    marsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('#marsOutput');
      setLoading(out, true);
      try {
        ensureApiKey();
        const date = $('#marsDate')?.value || '';
        const rover = $('#marsRover')?.value || 'curiosity';
        const camera = $('#marsCamera')?.value || '';
        const data = date ? await fetchMarsPhotos({ date, rover, camera, apiKey: state.apiKey }) : await fetchLatestMarsPhotos({ rover, camera, apiKey: state.apiKey });
        renderMars(out, data);
      } catch (err) { handleError(out, err, 'Failed to load Mars photos.'); }
      finally { setLoading(out, false); }
    });
  }

  const neoForm = $('#neoForm');
  if (neoForm) {
    neoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('#neoOutput');
      setLoading(out, true);
      try {
        ensureApiKey();
        const start = $('#neoStart')?.value;
        const end = $('#neoEnd')?.value;
        const data = await fetchNearEarthObjects({ start, end, apiKey: state.apiKey });
        renderNEO(out, data);
        state.neoVisualizer?.dispose();
        state.neoVisualizer = new NEO3DVisualizer($('#neoCanvas'));
        state.neoVisualizer.load(data);
      } catch (err) { handleError(out, err, 'Failed to load Near-Earth Objects.'); }
      finally { setLoading(out, false); }
    });
  }

  const cometForm = $('#cometForm');
  if (cometForm) {
    cometForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('#cometOutput');
      setLoading(out, true);
      try {
        ensureApiKey();
        const designation = $('#cometDesignation')?.value?.trim();
        if (!designation) throw new Error('Missing comet designation');
        const traj = await fetchComet3ITrajectory({ designation, apiKey: state.apiKey });
        renderComet(out, traj);
      } catch (err) { handleError(out, err, 'Failed to load comet trajectory.'); }
      finally { setLoading(out, false); }
    });
  }

  const telescopeForm = $('#telescopeForm');
  if (telescopeForm) {
    telescopeForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = $('#telescopeOutput');
      setLoading(out, true);
      try { const mission = $('#telescopeMission')?.value || 'JWST'; const data = await fetchEnhancedTelescopeData({ mission }); renderTelescope(out, data); }
      catch (err) { handleError(out, err, 'Failed to load telescope data.'); }
      finally { setLoading(out, false); }
    });
  }

  $$('#newsTabs [data-category]')?.forEach((btn) =>
    btn.addEventListener('click', async () => { await loadNews(btn.getAttribute('data-category') || 'nasa'); })
  );
}

function renderAPOD(out, data) {
  if (!out) return;
  if (!data) { out.innerHTML = '<p>No APOD data.</p>'; return; }
  const media = data.media_type === 'video'
    ? `<iframe src="${safeText(data.url)}" title="APOD video" allowfullscreen loading="lazy"></iframe>`
    : `<img src="${safeText(data.hdurl || data.url)}" alt="${safeText(data.title)}" loading="lazy"/>`;
  out.innerHTML = `
    <article class="apod">
      <h3>${safeText(data.title)}</h3>
      <div class="apod-media">${media}</div>
      <p class="apod-date">${safeText(data.date)}</p>
      <p class="apod-explanation">${safeText(data.explanation)}</p>
    </article>`;
}

function renderMars(out, payload) {
  if (!out) return;
  const photos = Array.isArray(payload?.photos) ? payload.photos : Array.isArray(payload) ? payload : [];
  if (!photos.length) { out.innerHTML = '<p>No photos found for that date/rover.</p>'; return; }
  const items = photos.slice(0, 50).map((p) => `
    <figure class="mars-photo">
      <img src="${safeText(p.img_src)}" alt="Mars ${safeText(p.rover?.name)} ${safeText(p.camera?.full_name || p.camera?.name)}" loading="lazy"/>
      <figcaption>Sol ${safeText(p.sol)} • ${safeText(p.earth_date)} • ${safeText(p.rover?.name)} • ${safeText(p.camera?.full_name || p.camera?.name)}</figcaption>
    </figure>`).join('');
  out.innerHTML = `<div class="mars-grid">${items}</div>`;
}

function renderNEO(out, data) {
  if (!out) return;
  const byDate = data?.near_earth_objects || {};
  const dates = Object.keys(byDate).sort();
  if (!dates.length) { out.innerHTML = '<p>No NEO data in this range.</p>'; return; }
  out.innerHTML = dates.map((d) => {
    const items = (byDate[d] || []).map((o) => `
      <li><strong>${safeText(o.name)}</strong> • H=${safeText(o.absolute_magnitude_h)} • MinDia=${safeText(o.estimated_diameter?.meters?.estimated_diameter_min?.toFixed?.(2))}m</li>`).join('');
    return `<section class="neo-day"><h4>${safeText(d)}</h4><ul>${items}</ul></section>`;
  }).join('');
}

function renderComet(out, traj) {
  if (!out) return;
  const pts = Array.isArray(traj?.points) ? traj.points : [];
  if (!pts.length) { out.innerHTML = '<p>No trajectory points.</p>'; return; }
  const rows = pts.slice(0, 200).map((p) => `
    <tr><td>${safeText(p.epoch)}</td><td>${safeText(p.r)}</td><td>${safeText(p.v)}</td></tr>`).join('');
  out.innerHTML = `<table class="comet-traj"><thead><tr><th>Epoch</th><th>r (AU)</th><th>v (km/s)</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function renderTelescope(out, data) {
  if (!out) return;
  if (!data) { out.innerHTML = '<p>No telescope data.</p>'; return; }
  const stats = getTelescopeStats(data);
  const items = (Array.isArray(data.items) ? data.items : []).slice(0, 50).map((it) => {
    const thumb = safeText(it.thumbnail || it.image || it.url || '');
    const title = safeText(it.title || it.name || 'Observation');
    const link = safeText(it.link || it.url || '#');
    return `<article class="tel-item">${thumb ? `<img src="${thumb}" alt="${title}" loading="lazy"/>` : ''}<h4><a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a></h4></article>`;
  }).join('');
  out.innerHTML = `<section class="tel-stats"><div>Total items: ${safeText(stats.total)}</div><div>Missions: ${safeText((stats.missions || []).join(', '))}</div></section><div class="tel-grid">${items}</div>`;
}

async function loadNews(category = 'nasa') {
  const container = $('#newsOutput');
  setLoading(container, true);
  try {
    const items = category === 'nasa' ? await fetchNASANews() : await fetchAggregatedSpaceNews({ category });
    state.newsCategory = category;
    state.newsItems = Array.isArray(items) ? items : [];
    const list = state.newsItems.slice(0, 50).map((n) => {
      const title = safeText(n.title || n.headline || 'Untitled');
      const url = safeText(n.url || n.link || '#');
      const source = safeText(n.source || '');
      const date = safeText(formatNewsDate(n.published_at || n.date));
      const emoji = getCategoryEmoji(n.category || category);
      return `<article class="news-item"><h4>${emoji} <a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a></h4><div class="news-meta">${source} • ${date}</div></article>`;
    }).join('');
    container.innerHTML = list || '<p>No news found.</p>';
  } catch (err) { handleError(container, err, 'Failed to load news.'); }
  finally { setLoading(container, false); }
}

// Kickstart
init().catch((e) => console.error('Init failed', e));
