/**
 * CineVibe — SPA Router & App Logic
 * Orchestrates routing, page rendering, state, and events.
 */

// ── State ─────────────────────────────────────────────────
const CV = (() => {
    // Private state
    let _heroItems = [];
    let _heroIndex = 0;
    let _heroTimer = null;
    let _searchTimer = null;
    let _browseState = { type: null, page: 1, genre: 'all' };
    let _currentDetailId = null;
    let _currentDetailType = null;

    // ── Storage helpers ─────────────────────────────────────
    function getWatchlist() {
        try { return JSON.parse(localStorage.getItem('cv_watchlist') || '[]'); }
        catch { return []; }
    }

    function saveWatchlist(list) {
        localStorage.setItem('cv_watchlist', JSON.stringify(list));
    }

    function getHistory() {
        try { return JSON.parse(localStorage.getItem('cv_history') || '[]'); }
        catch { return []; }
    }

    function addToHistory(id, type, title) {
        const hist = getHistory();
        const filtered = hist.filter(h => !(h.id === id && h.type === type));
        filtered.unshift({ id, type, title, ts: Date.now() });
        localStorage.setItem('cv_history', JSON.stringify(filtered.slice(0, 50)));
    }

    function getUser() {
        try { return JSON.parse(localStorage.getItem('cv_user') || 'null'); }
        catch { return null; }
    }

    // ── Toast ────────────────────────────────────────────────
    let _toastTimer = null;
    function toast(msg, type = '') {
        const el = document.getElementById('toast');
        if (!el) return;
        el.textContent = msg;
        el.className = `toast show ${type}`;
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => {
            el.classList.remove('show');
        }, 3000);
    }

    // ── Watchlist ────────────────────────────────────────────
    function isInWatchlist(id, type) {
        return getWatchlist().some(w => w.id === id && w.type === type);
    }

    function toggleWatchlist(id, type, title) {
        let list = getWatchlist();
        if (isInWatchlist(id, type)) {
            list = list.filter(w => !(w.id === id && w.type === type));
            toast('Removed from Watchlist');
        } else {
            list.unshift({ id, type, title, ts: Date.now() });
            toast('❤️ Added to Watchlist', 'success');
        }
        saveWatchlist(list);
        const btn = document.getElementById('wl-btn');
        if (btn) {
            const inList = isInWatchlist(id, type);
            btn.classList.toggle('in-list', inList);
            btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="${inList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
        ${inList ? 'In Watchlist' : 'Watchlist'}
      `;
        }
    }

    // ── Carousel Scroll ──────────────────────────────────────
    function scrollCarousel(trackId, dir) {
        const track = document.getElementById(trackId);
        if (!track) return;
        const cardW = track.querySelector('.card, .top10-item')?.offsetWidth || 160;
        track.scrollBy({ left: dir * (cardW + 12) * 4, behavior: 'smooth' });
    }

    // ── Navigate ─────────────────────────────────────────────
    function navigate(path) {
        window.location.hash = `#/${path}`;
    }

    // ── Router ───────────────────────────────────────────────
    function parseRoute(hash) {
        const path = hash.replace(/^#\/?/, '');
        const [seg1, seg2, seg3, seg4, seg5] = path.split('/');
        return { seg1, seg2, seg3, seg4, seg5, path };
    }

    async function route() {
        const hash = window.location.hash || '#/';
        const { seg1, seg2, seg3, seg4, seg5 } = parseRoute(hash);
        const app = document.getElementById('app');

        // Scroll to top
        window.scrollTo(0, 0);

        // Always show navbar (player will hide it)
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.style.display = '';

        // Update active nav
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));

        if (!seg1 || seg1 === '') {
            document.getElementById('nav-home')?.classList.add('active');
            await renderHome();
        } else if (seg1 === 'movie' && seg2) {
            await renderDetail('movie', parseInt(seg2));
        } else if (seg1 === 'tv' && seg2) {
            await renderDetail('tv', parseInt(seg2));
        } else if (seg1 === 'watch' && seg2 === 'movie' && seg3) {
            await renderPlayer('movie', parseInt(seg3), null, null);
        } else if (seg1 === 'watch' && seg2 === 'tv' && seg3) {
            const s = parseInt(seg4) || 1;
            const e = parseInt(seg5) || 1;
            await renderPlayer('tv', parseInt(seg3), s, e);
        } else if (seg1 === 'browse' && seg2) {
            await renderBrowse(seg2);
        } else if (seg1 === 'watchlist') {
            renderWatchlistPage();
        } else if (seg1 === 'api') {
            document.getElementById('nav-api')?.classList.add('active');
            app.innerHTML = buildApiPage();
        } else {
            // Fallback to home
            await renderHome();
        }
    }

    // ── Home Page ─────────────────────────────────────────────
    async function renderHome() {
        const app = document.getElementById('app');
        // Show hero skeleton while loading
        app.innerHTML = `<div class="skeleton skeleton-hero" style="min-height:100vh"></div>`;

        // Fetch all data in parallel
        const [trending, top10, topRatedMovies, netflixSeries, topRatedTV, animeShows] = await Promise.all([
            getTrending('all', 'week'),
            getTrending('all', 'day'),
            getTopRated('movie'),
            getByNetwork(NETWORKS.Netflix),
            getTopRated('tv'),
            getAnime(),
        ]);

        _heroItems = trending.filter(i => i.backdrop_path).slice(0, 8);

        let html = '';
        html += buildHero(_heroItems);
        html += buildTop10(top10);
        html += buildRow('Trending Today', trending.slice(0, 20), {
            rowId: 'trending',
            tabs: [{ label: 'Movies', value: 'movie' }, { label: 'Series', value: 'tv' }]
        });
        html += buildRow('Series on Netflix', netflixSeries.slice(0, 20), { rowId: 'netflix' });
        html += buildRow('Top Rated', topRatedMovies.slice(0, 20), {
            rowId: 'toprated',
            tabs: [{ label: 'Movies', value: 'movie' }, { label: 'Series', value: 'tv' }]
        });
        html += buildRow('Anime', animeShows.slice(0, 20), { rowId: 'anime' });
        html += buildGenreSection('Action');
        html += buildFooter();

        app.innerHTML = html;

        // Start hero rotation
        startHeroRotation();

        // Load genre content
        switchGenre('Action');
    }

    // ── Hero Rotation ────────────────────────────────────────
    function startHeroRotation() {
        clearInterval(_heroTimer);
        _heroTimer = setInterval(() => {
            advanceHero();
        }, 7000);
    }

    function advanceHero(dir = 1) {
        if (!_heroItems.length) return;
        const slides = document.querySelectorAll('.hero-slide');
        const dots = document.querySelectorAll('.hero-dot');
        if (!slides.length) return;
        slides[_heroIndex]?.classList.remove('active');
        dots[_heroIndex]?.classList.remove('active');
        _heroIndex = (_heroIndex + dir + _heroItems.length) % _heroItems.length;
        slides[_heroIndex]?.classList.add('active');
        dots[_heroIndex]?.classList.add('active');
    }

    // ── Carousel Tab Switching ────────────────────────────────
    async function switchTab(btnEl, rowId, tabValue) {
        // Update active tab
        const tabsContainer = btnEl.closest('.row-tabs');
        tabsContainer?.querySelectorAll('.row-tab').forEach(t => t.classList.remove('active'));
        btnEl.classList.add('active');

        const trackId = `track-${rowId}`;
        const track = document.getElementById(trackId);
        if (!track) return;

        // Show skeleton
        track.innerHTML = Array(8).fill(`<div class="skeleton skeleton-card"></div>`).join('');

        let items = [];
        if (rowId === 'trending') {
            items = await getTrending(tabValue, 'week');
        } else if (rowId === 'toprated') {
            items = await getTopRated(tabValue);
        }

        track.innerHTML = items.slice(0, 20).map(i => buildCard({ ...i, media_type: tabValue })).join('');
    }

    // ── Genre Switching ───────────────────────────────────────
    const MOVIE_GENRE_IDS = {
        Comedy: 35, Action: 28, Horror: 27, Romance: 10749,
        SciFi: 878, Drama: 18, Animation: 16, Thriller: 53,
    };

    async function switchGenre(genreName) {
        // Update active tab
        document.querySelectorAll('.genre-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.genre === genreName);
        });

        const track = document.getElementById('track-genre');
        if (!track) return;
        track.innerHTML = Array(8).fill(`<div class="skeleton skeleton-card"></div>`).join('');

        const genreId = MOVIE_GENRE_IDS[genreName];
        if (!genreId) return;

        const items = await getByGenre('movie', genreId);
        track.innerHTML = items.slice(0, 20).map(i => buildCard({ ...i, media_type: 'movie' })).join('');
    }

    // ── Detail Page ───────────────────────────────────────────
    async function renderDetail(type, id) {
        const app = document.getElementById('app');
        app.innerHTML = `<div class="detail-page"><div class="skeleton" style="height:70vh"></div></div>`;

        _currentDetailId = id;
        _currentDetailType = type;

        const item = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id);
        const recs = (item.recommendations && item.recommendations.results) || [];

        app.innerHTML = buildDetailPage(item, type, recs);

        // Load episodes for TV
        if (type === 'tv' && item.seasons) {
            const firstRealSeason = item.seasons.find(s => s.season_number > 0);
            if (firstRealSeason) {
                loadSeason(id, firstRealSeason.season_number);
            }
        }

        // Track history
        addToHistory(id, type, getTitle(item));
    }

    // ── Load Season Episodes ──────────────────────────────────
    async function loadSeason(showId, seasonNum) {
        const grid = document.getElementById('episodes-grid');
        if (!grid) return;
        grid.innerHTML = Array(4).fill(`<div class="skeleton" style="height:88px;border-radius:8px"></div>`).join('');

        const data = await getTVSeason(showId, seasonNum);
        const episodes = (data && data.episodes) || [];
        grid.innerHTML = buildEpisodes(showId, episodes, seasonNum);
    }

    // ── Player Page ───────────────────────────────────────────
    async function renderPlayer(type, id, season, episode) {
        const app = document.getElementById('app');
        let title = '';

        // Hide the site navbar — player has its own topbar
        const navbar = document.getElementById('navbar');
        if (navbar) navbar.style.display = 'none';

        // Try to get title from TMDB
        try {
            const data = type === 'movie' ? await getMovieDetails(id) : await getTVDetails(id);
            title = getTitle(data);
        } catch (e) { }

        app.innerHTML = buildPlayerPage(type, id, season, episode, title);
        addToHistory(id, type, title);
    }

    // ── Browse Page ───────────────────────────────────────────
    const BROWSE_GENRES = {
        movies: [
            { label: 'Action', value: '28' }, { label: 'Comedy', value: '35' },
            { label: 'Drama', value: '18' }, { label: 'Horror', value: '27' },
            { label: 'Sci-Fi', value: '878' }, { label: 'Romance', value: '10749' },
            { label: 'Thriller', value: '53' }, { label: 'Animation', value: '16' },
        ],
        tv: [
            { label: 'Drama', value: '18' }, { label: 'Comedy', value: '35' },
            { label: 'Action', value: '10759' }, { label: 'Sci-Fi', value: '10765' },
            { label: 'Crime', value: '80' }, { label: 'Mystery', value: '9648' },
        ],
        anime: [],
    };

    const BROWSE_TITLES = {
        movies: 'Movies', tv: 'TV Shows', anime: 'Anime',
    };

    async function renderBrowse(type) {
        const app = document.getElementById('app');
        app.innerHTML = `<div class="browse-page"><div class="browse-page-header"><h1 class="browse-page-title">${BROWSE_TITLES[type] || ''}</h1></div><div class="browse-grid">${Array(20).fill('<div class="skeleton" style="aspect-ratio:2/3;border-radius:8px"></div>').join('')}</div></div>`;

        _browseState = { type, page: 1, genre: 'all' };

        let items = [];
        if (type === 'anime') {
            items = await getAnime(1);
        } else {
            items = await getPopular(type === 'movies' ? 'movie' : 'tv', 1);
        }

        const mediaType = type === 'movies' ? 'movie' : 'tv';
        app.innerHTML = buildBrowsePage(mediaType, items, BROWSE_TITLES[type] || '', BROWSE_GENRES[type] || []);
    }

    async function filterBrowse(btnEl, type, genreId) {
        // Update active chip
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btnEl.classList.add('active');

        const grid = document.getElementById('browse-grid');
        if (!grid) return;
        grid.innerHTML = Array(20).fill(`<div class="skeleton" style="aspect-ratio:2/3;border-radius:8px"></div>`).join('');

        _browseState.genre = genreId;
        _browseState.page = 1;

        let items = [];
        if (genreId === 'all') {
            items = await getPopular(type, 1);
        } else {
            items = await getByGenre(type, genreId, 1);
        }
        grid.innerHTML = items.map(i => buildCard({ ...i, media_type: type })).join('');
    }

    async function loadMoreBrowse(type) {
        const grid = document.getElementById('browse-grid');
        if (!grid) return;
        _browseState.page++;

        const btn = document.getElementById('load-more-btn');
        if (btn) btn.textContent = 'Loading...';

        let items = [];
        if (_browseState.genre === 'all') {
            items = await getPopular(type, _browseState.page);
        } else {
            items = await getByGenre(type, _browseState.genre, _browseState.page);
        }

        grid.insertAdjacentHTML('beforeend', items.map(i => buildCard({ ...i, media_type: type })).join(''));
        if (btn) btn.textContent = 'Load More';
    }

    // ── Watchlist Page ────────────────────────────────────────
    function renderWatchlistPage() {
        const app = document.getElementById('app');
        const list = getWatchlist();
        app.innerHTML = buildWatchlistPage(list);
    }

    // ── Search ────────────────────────────────────────────────
    function initSearch() {
        const overlay = document.getElementById('search-overlay');
        const input = document.getElementById('search-input');
        const results = document.getElementById('search-results');
        const searchBtn = document.getElementById('search-btn');
        const closeBtn = document.getElementById('search-close');

        searchBtn?.addEventListener('click', () => {
            overlay.classList.add('open');
            setTimeout(() => input?.focus(), 100);
        });

        closeBtn?.addEventListener('click', closeSearch);

        overlay?.addEventListener('click', (e) => {
            if (e.target === overlay) closeSearch();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeSearch();
            if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                overlay.classList.add('open');
                setTimeout(() => input?.focus(), 100);
            }
        });

        input?.addEventListener('input', () => {
            const q = input.value.trim();
            clearTimeout(_searchTimer);
            if (!q) { results.innerHTML = ''; return; }
            results.innerHTML = `<div class="search-status">Searching...</div>`;
            _searchTimer = setTimeout(async () => {
                const items = await searchMulti(q);
                results.innerHTML = buildSearchResults(items, q);
            }, 400);
        });
    }

    function closeSearch() {
        const overlay = document.getElementById('search-overlay');
        overlay?.classList.remove('open');
        const input = document.getElementById('search-input');
        if (input) input.value = '';
        const results = document.getElementById('search-results');
        if (results) results.innerHTML = '';
    }

    // ── Browse Dropdown ───────────────────────────────────────
    function initBrowseDropdown() {
        const btn = document.getElementById('browse-btn');
        const dropdown = document.getElementById('browse-dropdown');

        if (!btn || !dropdown) return;

        dropdown.innerHTML = buildBrowseDropdown();
        dropdown.classList.remove('open');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = dropdown.classList.contains('open');
            closeDropdown();
            if (!isOpen) {
                dropdown.classList.add('open');
                btn.classList.add('open');
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.browse-wrapper')) closeDropdown();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeDropdown();
        });

        // Delegate dropdown item clicks
        dropdown.addEventListener('click', (e) => {
            const item = e.target.closest('[data-nav]');
            if (item) {
                navigate(item.dataset.nav);
                closeDropdown();
            }
            // Ads toggle
            const toggle = e.target.closest('#ads-toggle');
            if (toggle) {
                localStorage.setItem('cv_ads', toggle.checked ? 'true' : 'false');
            }
        });
    }

    function closeDropdown() {
        document.getElementById('browse-dropdown')?.classList.remove('open');
        document.getElementById('browse-btn')?.classList.remove('open');
    }

    // ── Auth Modal ────────────────────────────────────────────
    function initAuth() {
        const modal = document.getElementById('auth-modal');
        const openBtn = document.getElementById('auth-btn');
        const closeBtn = document.getElementById('auth-close');
        const tabLogin = document.getElementById('tab-login');
        const tabSignup = document.getElementById('tab-signup');
        const formLogin = document.getElementById('form-login');
        const formSignup = document.getElementById('form-signup');

        openBtn?.addEventListener('click', () => {
            const user = getUser();
            if (user) {
                toast(`Hello, ${user.username}! 👋`);
                return;
            }
            modal?.classList.add('open');
        });

        closeBtn?.addEventListener('click', () => modal?.classList.remove('open'));

        document.getElementById('login-cancel')?.addEventListener('click', () => modal?.classList.remove('open'));
        document.getElementById('signup-cancel')?.addEventListener('click', () => modal?.classList.remove('open'));

        modal?.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('open');
        });

        tabLogin?.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabSignup?.classList.remove('active');
            formLogin?.classList.remove('hidden');
            formSignup?.classList.add('hidden');
        });

        tabSignup?.addEventListener('click', () => {
            tabSignup.classList.add('active');
            tabLogin?.classList.remove('active');
            formSignup?.classList.remove('hidden');
            formLogin?.classList.add('hidden');
        });

        document.getElementById('login-submit')?.addEventListener('click', () => {
            const username = document.getElementById('login-username')?.value?.trim();
            const password = document.getElementById('login-password')?.value;
            if (!username || !password) { toast('Please fill all fields', 'error'); return; }
            const users = JSON.parse(localStorage.getItem('cv_users') || '[]');
            const user = users.find(u => u.username === username && u.password === btoa(password));
            if (!user) { toast('Invalid username or password', 'error'); return; }
            localStorage.setItem('cv_user', JSON.stringify({ username: user.username, email: user.email }));
            modal?.classList.remove('open');
            toast(`Welcome back, ${username}! 🎬`, 'success');
            updateAuthBtn();
        });

        document.getElementById('signup-submit')?.addEventListener('click', () => {
            const username = document.getElementById('signup-username')?.value?.trim();
            const email = document.getElementById('signup-email')?.value?.trim();
            const password = document.getElementById('signup-password')?.value;
            if (!username || !email || !password) { toast('Please fill all fields', 'error'); return; }
            if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }
            const users = JSON.parse(localStorage.getItem('cv_users') || '[]');
            if (users.find(u => u.username === username)) { toast('Username already taken', 'error'); return; }
            users.push({ username, email, password: btoa(password) });
            localStorage.setItem('cv_users', JSON.stringify(users));
            localStorage.setItem('cv_user', JSON.stringify({ username, email }));
            modal?.classList.remove('open');
            toast(`Welcome to CineVibe, ${username}! 🎬`, 'success');
            updateAuthBtn();
        });
    }

    function updateAuthBtn() {
        const user = getUser();
        const btn = document.getElementById('auth-btn');
        if (!btn) return;
        if (user) {
            btn.title = `Logged in as ${user.username}`;
            btn.style.color = 'var(--accent)';
        } else {
            btn.title = 'Account';
            btn.style.color = '';
        }
    }

    // ── Navbar scroll effect ──────────────────────────────────
    function initNavbarScroll() {
        const navbar = document.getElementById('navbar');
        window.addEventListener('scroll', () => {
            navbar?.classList.toggle('scrolled', window.scrollY > 50);
        }, { passive: true });
    }

    // ── Hero dot clicks ───────────────────────────────────────
    function initHeroDots() {
        document.addEventListener('click', (e) => {
            const dot = e.target.closest('.hero-dot');
            if (!dot) return;
            const targetIdx = parseInt(dot.dataset.dot);
            const slides = document.querySelectorAll('.hero-slide');
            const dots = document.querySelectorAll('.hero-dot');
            slides[_heroIndex]?.classList.remove('active');
            dots[_heroIndex]?.classList.remove('active');
            _heroIndex = targetIdx;
            slides[_heroIndex]?.classList.add('active');
            dots[_heroIndex]?.classList.add('active');
            clearInterval(_heroTimer);
            startHeroRotation();
        });
    }

    // ── Source Switcher ───────────────────────────────────────
    function switchSource(url, btn) {
        const iframe = document.getElementById('player-iframe');
        if (!iframe) return;
        iframe.src = url;
        // Update active button
        document.querySelectorAll('.source-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // ── Init ──────────────────────────────────────────────────
    function init() {
        initNavbarScroll();
        initSearch();
        initBrowseDropdown();
        initAuth();
        initHeroDots();
        updateAuthBtn();

        // Route
        window.addEventListener('hashchange', route);
        route();
    }

    // Return public API
    return {
        navigate,
        scrollCarousel,
        switchTab,
        switchGenre,
        toggleWatchlist,
        isInWatchlist,
        loadSeason,
        filterBrowse,
        loadMoreBrowse,
        switchSource,
        toast,
        init,
    };
})();

// Boot when DOM ready
document.addEventListener('DOMContentLoaded', () => CV.init());
