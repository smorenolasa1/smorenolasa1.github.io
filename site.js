// site.js

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year')?.append(new Date().getFullYear());

  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  loadProjects();       // renders if #featured / #grid exist
  loadPublications();   // renders if #thesis / #pubsGrid exist
});

// ---- Helpers ----
function baseUrl() {
  return (
    document.querySelector('base')?.href ||
    window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
  );
}
function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// ---- Projects ----
async function loadProjects() {
  try {
    const url = new URL('data/projects.json', baseUrl()).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`);
    const projects = await res.json();

    // Featured (index.html)
    const featured = document.getElementById('featured');
    if (featured) {
      projects.filter(p => p.featured).slice(0, 6).forEach(p => featured.appendChild(projectCard(p)));
    }

    // Full grid + tag bar (projects.html)
    const grid = document.getElementById('grid');
    const tagBar = document.getElementById('tagBar');
    if (grid && tagBar) {
      const uniqueTags = Array.from(new Set(projects.flatMap(p => p.tags || []))).sort();
      const state = { tag: 'All' };

      function render() {
        grid.innerHTML = '';
        projects
          .filter(p => state.tag === 'All' || (p.tags || []).includes(state.tag))
          .forEach(p => grid.appendChild(projectCard(p)));
      }

      tagBar.innerHTML = '';
      ['All', ...uniqueTags].forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = t;
        btn.className = 'chip px-3 py-1 rounded-full text-sm text-slate-300 hover:text-white transition';
        btn.addEventListener('click', () => {
          state.tag = t;
          [...tagBar.children].forEach(b => b.classList.remove('bg-white/10'));
          btn.classList.add('bg-white/10');
          render();
        });
        if (t === 'All') btn.classList.add('bg-white/10');
        tagBar.appendChild(btn);
      });

      render();
    }
  } catch (e) {
    console.error('Error loading projects.json', e);
    document.getElementById('grid')?.insertAdjacentHTML('beforebegin',
      `<p class="text-sm text-red-400">Could not load projects. ${e.message}</p>`);
  }
}

function projectCard(p) {
  const a = document.createElement('a');
  a.href = p.demo || p.repo || '#';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'card group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition';
  a.innerHTML = `
    <div class="relative aspect-video bg-slate-900/40 flex items-center justify-center">
      ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover">`
                 : '<span class="text-sm text-slate-500">No image</span>'}
      <div class="shine absolute inset-0 opacity-0 translate-y-4 transition duration-500 bg-gradient-to-t from-transparent via-transparent to-white/10"></div>
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-semibold">${escapeHtml(p.title)}</h3>
        <span class="text-xs text-slate-400">${p.year || ''}</span>
      </div>
      <p class="text-sm text-slate-400">${escapeHtml(p.summary || '')}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        ${(p.tags || []).map(t => `<span class="chip text-xs px-2 py-0.5 rounded-full text-slate-300">${escapeHtml(t)}</span>`).join('')}
      </div>
    </div>
  `;
  return a;
}

// ---- Publications ----
async function loadPublications() {
  try {
    const url = new URL('data/publications.json', baseUrl()).toString();
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return; // safe no-op on other pages
    const data = await res.json();

    const thesisWrap = document.getElementById('thesis');
    if (thesisWrap && Array.isArray(data.thesis)) {
      data.thesis.forEach(t => thesisWrap.appendChild(pubCard(t)));
    }

    const grid = document.getElementById('pubsGrid');
    if (grid && Array.isArray(data.papers)) {
      data.papers.forEach(p => grid.appendChild(pubCard(p)));
    }
  } catch (e) {
    console.debug('Publications not loaded:', e.message);
  }
}

function pubCard(p) {
  const el = document.createElement('article');
  el.className = 'card group rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition';

  const actions = [];
  if (p.pdf) actions.push(btn('PDF', p.pdf));
  if (p.doi) actions.push(btn('DOI', p.doi));
  if (p.code) actions.push(btn('Code', p.code));
  if (Array.isArray(p.artifacts)) {
    p.artifacts.forEach(x => actions.push(btn(escapeHtml(x.label), x.url)));
  }

  el.innerHTML = `
    <div class="relative aspect-video bg-slate-900/40 flex items-center justify-center">
      ${p.image ? `<img src="${p.image}" alt="${escapeHtml(p.title)}" class="w-full h-full object-cover">`
                 : '<span class="text-sm text-slate-500">No image</span>'}
      <div class="shine absolute inset-0 opacity-0 translate-y-4 transition duration-500 bg-gradient-to-t from-transparent via-transparent to-white/10"></div>
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h3 class="font-semibold leading-snug">${escapeHtml(p.title)}</h3>
          <div class="mt-1 text-xs text-slate-400">${escapeHtml((p.authors || []).join(', '))}</div>
          <div class="text-xs text-slate-500">${escapeHtml(p.venue || '')}${p.year ? ` · ${p.year}` : ''}</div>
        </div>
      </div>
      ${p.summary ? `<p class="mt-3 text-sm text-slate-400">${escapeHtml(p.summary)}</p>` : ''}
      ${actions.length ? `<div class="mt-3 flex flex-wrap gap-2">${actions.join('')}</div>` : ''}
    </div>
  `;
  return el;

  function btn(label, url) {
    return `<a class="px-2 py-1 text-xs rounded-lg border border-white/10 hover:border-white/20" href="${url}" target="_blank" rel="noopener">${label}</a>`;
  }
}