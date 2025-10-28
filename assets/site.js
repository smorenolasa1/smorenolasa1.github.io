// ---------- SETTINGS ----------
const GITHUB_USER = "smorenolasa1";
const INCLUDE_TOPIC = "portfolio";   // only repos with this topic appear
const FEATURED_TOPIC = "featured";   // repos with this topic appear on home

// year & theme toggle
document.getElementById('year')?.append(new Date().getFullYear());
const themeBtn = document.getElementById('themeBtn');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
}

// Cache to reduce API calls (rate limit: 60/hour unauthenticated)
const CACHE_KEY = "gh_projects_cache_v1";
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

async function fetchWithCache(url, headers) {
  const now = Date.now();
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) return cached.data;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error("GitHub API error: " + res.status);
  const data = await res.json();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: now, data }));
  return data;
}

// Load GitHub repos (public, no token)
async function loadFromGitHub() {
  const headers = {
    // topics are included in the REST response nowadays, but accept header helps
    "Accept": "application/vnd.github+json"
  };
  // up to 100 repos; sort by updated
  const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;

  const repos = await fetchWithCache(url, headers);

  // Normalize to the card shape the site expects
  const projects = repos
    .filter(r =>
      !r.fork &&
      !r.archived &&
      r.topics && r.topics.includes(INCLUDE_TOPIC)
    )
    .map(r => ({
      title: r.name.replace(/-/g, " "),
      year: (new Date(r.pushed_at)).getFullYear(),
      tags: r.topics || [],
      summary: r.description || "",
      repo: r.html_url,
      demo: r.homepage || "",
      image: "",                 // optional: keep empty or set manually below
      featured: (r.topics || []).includes(FEATURED_TOPIC)
    }));

  return projects;
}

// Fallback: merge with local /data/projects.json (optional curated entries)
async function loadLocalProjects() {
  try {
    const res = await fetch('data/projects.json');
    if (!res.ok) return [];
    return await res.json();
  } catch { return []; }
}

async function loadProjects() {
  const [gh, local] = await Promise.all([loadFromGitHub().catch(() => []), loadLocalProjects()]);
  const projects = dedupeByTitle([...gh, ...local]);

  // Featured on home
  const featured = document.getElementById('featured');
  if (featured) {
    projects.filter(p => p.featured).slice(0, 6).forEach(p => featured.appendChild(card(p)));
  }

  // Full grid page
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
    ['All', ...uniqueTags].forEach(t => {
      const btn = document.createElement('button');
      btn.textContent = t;
      btn.className = 'px-3 py-1 rounded-xl border text-sm dark:border-slate-700';
      btn.addEventListener('click', () => { state.tag = t; render(); });
      tagBar.appendChild(btn);
    });
    render();
  }
}

function dedupeByTitle(list) {
  const seen = new Set();
  return list.filter(p => (seen.has(p.title) ? false : (seen.add(p.title), true)));
}

function card(p) {
  const a = document.createElement('a');
  a.href = p.demo || p.repo || '#';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.className = 'block rounded-3xl overflow-hidden border dark:border-slate-800 transform transition duration-500 hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-1';
  a.innerHTML = `
    <div class="aspect-video bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
      ${p.image ? `<img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover">` : '<span class="text-sm text-slate-500">No image</span>'}
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

loadProjects();