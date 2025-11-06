// set year
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('year')?.append(new Date().getFullYear());

  // theme toggle
  const themeBtn = document.getElementById('themeBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  // load projects if needed
  loadProjects();
});

async function loadProjects() {
  try {
    // Compute path to data/projects.json that works on root or subpath
    const base = document.querySelector('base')?.href
      || window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
    const url = new URL('data/projects.json', base).toString();

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching ${url}`);
    const projects = await res.json();

    // Featured (index.html)
    const featured = document.getElementById('featured');
    if (featured) {
      projects.filter(p => p.featured).slice(0, 6).forEach(p => featured.appendChild(card(p)));
    }

    // Full grid + tags (projects.html)
    const grid = document.getElementById('grid');
    const tagBar = document.getElementById('tagBar');
    if (grid && tagBar) {
      const uniqueTags = Array.from(new Set(projects.flatMap(p => p.tags || []))).sort();
      const state = { tag: 'All' };

      function render() {
        grid.innerHTML = '';
        projects
          .filter(p => state.tag === 'All' || (p.tags || []).includes(state.tag))
          .forEach(p => grid.appendChild(card(p)));
      }

      tagBar.innerHTML = '';
      ['All', ...uniqueTags].forEach(t => {
        const btn = document.createElement('button');
        btn.textContent = t;
        btn.className = 'px-3 py-1 rounded-xl border text-sm dark:border-slate-700';
        btn.addEventListener('click', () => { state.tag = t; render(); });
        tagBar.appendChild(btn);
      });

      render();
    }
  } catch (e) {
    console.error('Error loading projects.json', e);
    document.getElementById('grid')?.insertAdjacentHTML('beforebegin',
      `<p class="text-sm text-red-600">Could not load projects. ${e.message}</p>`);
  }
}

function card(p) {
  const a = document.createElement('a');
  a.href = p.demo || p.repo || '#';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'block rounded-3xl overflow-hidden border dark:border-slate-800 transform transition duration-500 hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-1';
  a.innerHTML = `
    <div class="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      ${p.image ? `<img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover">`
                 : '<span class="text-sm text-slate-500">No image</span>'}
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between mb-1">
        <h3 class="font-semibold">${p.title}</h3>
        <span class="text-xs text-slate-500">${p.year || ''}</span>
      </div>
      <p class="text-sm text-slate-600 dark:text-slate-400">${p.summary || ''}</p>
      <div class="mt-3 flex flex-wrap gap-2">
        ${(p.tags || []).map(t => `<span class="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">${t}</span>`).join('')}
      </div>
    </div>
  `;
  return a;
}