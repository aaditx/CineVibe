/**
 * CineVibe — UI Component Builder Module
 * All functions return HTML strings for injection via innerHTML.
 */

// ── Browse Dropdown ───────────────────────────────────────
function buildBrowseDropdown() {
  const adsEnabled = localStorage.getItem('cv_ads') !== 'false';
  return `
    <div class="dropdown-section-title">Content</div>
    <div class="dropdown-grid">
      <div class="dropdown-item" data-nav="browse/movies">
        <div class="dropdown-item-icon" style="background:#2d1b1b">🎬</div>
        Movies
      </div>
      <div class="dropdown-item" data-nav="browse/tv">
        <div class="dropdown-item-icon" style="background:#1b1b2d">📺</div>
        TV Shows
      </div>
      <div class="dropdown-item" data-nav="browse/anime">
        <div class="dropdown-item-icon" style="background:#1b2d1b">🎌</div>
        Anime
      </div>
    </div>

    <div class="dropdown-section-title">Features</div>
    <div class="dropdown-grid">
      <div class="dropdown-item" data-nav="browse/movies">
        <div class="dropdown-item-icon" style="background:#1b2030">📡</div>
        Channels
      </div>
      <div class="dropdown-item" data-nav="browse/movies?quality=4k">
        <div class="dropdown-item-icon" style="background:#20201b">🎬</div>
        4K
      </div>
      <div class="dropdown-item" style="opacity:0.5;cursor:default">
        <div class="dropdown-item-icon" style="background:#281b28">🎉</div>
        Watch Party
      </div>
    </div>

    <div class="dropdown-section-title">Personal</div>
    <div class="dropdown-grid-2">
      <div class="dropdown-item" data-nav="watchlist">
        <div class="dropdown-item-icon" style="background:#201b20">🕐</div>
        History
      </div>
      <div class="dropdown-item" data-nav="watchlist">
        <div class="dropdown-item-icon" style="background:#1b201b">❤️</div>
        Watchlist
      </div>
    </div>

    <div class="dropdown-divider"></div>
    <div class="dropdown-ads-row">
      <div class="ads-label">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
        Ads status
      </div>
      <label class="toggle-switch" title="Toggle Ads">
        <input type="checkbox" id="ads-toggle" ${adsEnabled ? 'checked' : ''} />
        <span class="toggle-slider"></span>
      </label>
    </div>
  `;
}

// ── Hero Section ──────────────────────────────────────────
function buildHero(items) {
  if (!items || !items.length) return `<div class="skeleton skeleton-hero"></div>`;
  const slides = items.slice(0, 8).map((item, i) => {
    const type = item.media_type || 'movie';
    const title = getTitle(item);
    const year = getYear(item);
    const rating = getRating(item);
    const desc = item.overview || '';
    const backdrop = tmdbBackdrop(item.backdrop_path, 'original');
    const genres = getGenreNames(item.genre_ids || [], type).join(' &nbsp;·&nbsp; ');
    return `
      <div class="hero-slide ${i === 0 ? 'active' : ''}" data-index="${i}">
        ${backdrop ? `<img class="hero-backdrop" src="${backdrop}" alt="${title}" loading="${i === 0 ? 'eager' : 'lazy'}" />` : ''}
        <div class="hero-content">
          <div class="hero-badge">${type === 'tv' ? '📺 TV Series' : '🎬 Movie'}</div>
          <h1 class="hero-title">${title.toUpperCase()}</h1>
          <div class="hero-meta">
            <span class="meta-chip">
              <svg class="meta-star" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ${rating}/10
            </span>
            ${year ? `<span class="meta-chip"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>${year}</span>` : ''}
            ${genres ? `<span class="meta-chip">${genres}</span>` : ''}
          </div>
          <p class="hero-desc">${desc}</p>
          <div class="hero-actions">
            <button class="btn-play" onclick="CV.navigate('${type}/${item.id}')">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play
            </button>
            <button class="btn-more" onclick="CV.navigate('${type}/${item.id}')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              See More
            </button>
          </div>
        </div>
      </div>
    `;
  });

  const dots = items.slice(0, 8).map((_, i) =>
    `<div class="hero-dot ${i === 0 ? 'active' : ''}" data-dot="${i}"></div>`
  ).join('');

  return `
    <section class="hero" id="hero-section">
      <div class="hero-slides">${slides.join('')}</div>
      <div class="hero-indicators" id="hero-indicators">${dots}</div>
    </section>
  `;
}

// ── Card ──────────────────────────────────────────────────
function buildCard(item) {
  const type = item.media_type || 'movie';
  const title = getTitle(item);
  const rating = getRating(item);
  const year = getYear(item);
  const poster = tmdbImg(item.poster_path, 'w342');
  return `
    <div class="card" data-id="${item.id}" data-type="${type}" onclick="CV.navigate('${type}/${item.id}')">
      <div class="card-poster">
        <img class="card-img" src="${poster}" alt="${title}" loading="lazy" />
        <div class="card-overlay">
          <div class="card-title">${title}</div>
          <div class="card-meta-row">
            <span class="card-rating">
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              ${rating}
            </span>
            ${year ? `<span>${year}</span>` : ''}
          </div>
        </div>
        ${type === 'tv' ? `
          <div class="card-type-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/></svg>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ── Top 10 Row ────────────────────────────────────────────
function buildTop10(items) {
  const cards = items.slice(0, 10).map((item, i) => `
    <div class="top10-item">
      <span class="top10-number">${i + 1}</span>
      <div class="top10-card" onclick="CV.navigate('${(item.media_type || 'movie')}/${item.id}')">
        <img src="${tmdbImg(item.poster_path, 'w342')}" alt="${getTitle(item)}" loading="lazy" />
      </div>
    </div>
  `).join('');

  return `
    <section class="top10-section" id="top10-section">
      <div class="top10-header">
        <div class="top10-big-text">
          <span class="top10-word">TOP</span>
          <span class="top10-num">10</span>
        </div>
        <div class="top10-subtitle">CONTENT<br>TODAY</div>
      </div>
      <div class="top10-carousel">
        <button class="carousel-btn prev" onclick="CV.scrollCarousel('top10-track', -1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="top10-track" id="top10-track">${cards}</div>
        <button class="carousel-btn next" onclick="CV.scrollCarousel('top10-track', 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>
  `;
}

// ── Content Row ───────────────────────────────────────────
function buildRow(title, items, { rowId, tabs = null } = {}) {
  const trackId = `track-${rowId}`;
  const cards = (items || []).map(buildCard).join('');
  const skeletons = Array(8).fill(`<div class="skeleton skeleton-card"></div>`).join('');

  const tabsHtml = tabs ? `
    <div class="row-tabs" data-row="${rowId}">
      ${tabs.map((t, i) => `
        <button class="row-tab ${i === 0 ? 'active' : ''}" data-tab="${t.value}" onclick="CV.switchTab(this, '${rowId}', '${t.value}')">
          ${t.label}
        </button>
      `).join('')}
    </div>
  ` : '';

  return `
    <section class="content-section" id="section-${rowId}">
      <div class="row-header">
        <div class="row-title-wrap">
          <div class="row-accent"></div>
          <h2 class="row-title">${title}</h2>
        </div>
        ${tabsHtml}
      </div>
      <div class="carousel-wrap">
        <button class="carousel-btn prev" onclick="CV.scrollCarousel('${trackId}', -1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="cards-track" id="${trackId}">
          ${cards || skeletons}
        </div>
        <button class="carousel-btn next" onclick="CV.scrollCarousel('${trackId}', 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>
  `;
}

// ── Genre Section ─────────────────────────────────────────
function buildGenreSection(activeGenre = 'Action') {
  const genres = ['Comedy', 'Action', 'Horror', 'Romance', 'SciFi', 'Drama', 'Animation', 'Thriller'];
  const tabs = genres.map(g => `
    <button class="genre-tab ${g === activeGenre ? 'active' : ''}" data-genre="${g}" onclick="CV.switchGenre('${g}')">
      ${g}
    </button>
  `).join('');

  return `
    <section class="genre-section" id="genre-section">
      <div class="row-header">
        <div class="row-title-wrap">
          <div class="row-accent"></div>
          <h2 class="row-title">Genres</h2>
        </div>
        <div class="genre-tabs" id="genre-tabs">${tabs}</div>
      </div>
      <div class="carousel-wrap">
        <button class="carousel-btn prev" onclick="CV.scrollCarousel('track-genre', -1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="cards-track" id="track-genre"></div>
        <button class="carousel-btn next" onclick="CV.scrollCarousel('track-genre', 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </section>
  `;
}

// ── Footer ────────────────────────────────────────────────
function buildFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-logo">
        <div class="footer-logo-icon">
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#e5173f"/>
            <polygon points="16,12 30,20 16,28" fill="white"/>
          </svg>
        </div>
        <span class="footer-logo-text">CineVibe</span>
      </div>
      <p class="footer-desc">
        This site does not store any files on our server. We only link to media hosted on 3rd party services.
      </p>
      <span class="footer-contact">contact@cinevibe.tv</span>
    </footer>
  `;
}

// ── Detail Page ───────────────────────────────────────────
function buildDetailPage(item, type, recommendations = []) {
  const title = getTitle(item);
  const year = getYear(item);
  const rating = getRating(item);
  const backdrop = tmdbBackdrop(item.backdrop_path, 'original');
  const poster = tmdbImg(item.poster_path, 'w342');
  const desc = item.overview || '';
  const cast = (item.credits && item.credits.cast) ? item.credits.cast.slice(0, 15) : [];
  const genres = (item.genres || []).map(g => g.name).join(' · ');
  const runtime = type === 'movie' ? item.runtime : null;
  const seasons = type === 'tv' ? item.seasons : null;
  const isInList = CV.isInWatchlist(item.id, type);

  const castHtml = cast.length ? `
    <div class="detail-section">
      <h3 class="detail-section-title">Cast</h3>
      <div class="cast-track">
        ${cast.map(c => `
          <div class="cast-card">
            <img class="cast-avatar" src="${c.profile_path ? tmdbImg(c.profile_path, 'w92') : 'https://via.placeholder.com/80x80/1a1a2e/666?text=?'}" alt="${c.name}" loading="lazy" />
            <div class="cast-name">${c.name}</div>
            <div class="cast-char">${c.character || ''}</div>
          </div>
        `).join('')}
      </div>
    </div>
  ` : '';

  const recsHtml = recommendations.length ? `
    <div class="detail-section">
      <h3 class="detail-section-title">More Like This</h3>
      <div class="carousel-wrap">
        <button class="carousel-btn prev" onclick="CV.scrollCarousel('track-recs', -1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="cards-track" id="track-recs">
          ${recommendations.slice(0, 20).map(r => buildCard({ ...r, media_type: type })).join('')}
        </div>
        <button class="carousel-btn next" onclick="CV.scrollCarousel('track-recs', 1)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  ` : '';

  const episodesHtml = type === 'tv' && seasons ? buildSeasonSelector(item, seasons) : '';

  const metaExtras = type === 'movie' && runtime
    ? `<span class="meta-chip">${Math.floor(runtime / 60)}h ${runtime % 60}m</span>`
    : type === 'tv' && item.number_of_seasons
      ? `<span class="meta-chip">${item.number_of_seasons} Season${item.number_of_seasons > 1 ? 's' : ''}</span>`
      : '';

  return `
    <div class="detail-page">
      <div class="detail-hero">
        ${backdrop ? `<img class="detail-backdrop" src="${backdrop}" alt="${title}" />` : ''}
        <div class="detail-content">
          <div class="back-btn" onclick="history.back()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </div>
          <h1 class="detail-title">${title}</h1>
          <div class="detail-meta">
            <div class="hero-meta">
              <span class="meta-chip">
                <svg class="meta-star" viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                ${rating}/10
              </span>
              ${year ? `<span class="meta-chip">${year}</span>` : ''}
              ${genres ? `<span class="meta-chip">${genres}</span>` : ''}
              ${metaExtras}
            </div>
          </div>
          <p class="detail-desc">${desc}</p>
          <div class="detail-actions">
            <button class="btn-play" onclick="CV.navigate('watch/${type}/${item.id}${type === 'tv' ? '/1/1' : ''}')">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Play
            </button>
            <button class="btn-watchlist ${isInList ? 'in-list' : ''}" id="wl-btn" onclick="CV.toggleWatchlist(${item.id}, '${type}', '${title}')">
              <svg viewBox="0 0 24 24" fill="${isInList ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
              ${isInList ? 'In Watchlist' : 'Watchlist'}
            </button>
          </div>
        </div>
      </div>
      <div class="detail-sections">
        ${episodesHtml}
        ${castHtml}
        ${recsHtml}
      </div>
    </div>
  `;
}

// ── Season Selector ───────────────────────────────────────
function buildSeasonSelector(show, seasons, activeSeason = 1) {
  const realSeasons = seasons.filter(s => s.season_number > 0);
  const seasonOpts = realSeasons.map(s =>
    `<option value="${s.season_number}" ${s.season_number === activeSeason ? 'selected' : ''}>${s.name}</option>`
  ).join('');

  return `
    <div class="detail-section" id="episodes-section">
      <h3 class="detail-section-title">Episodes</h3>
      <div class="season-selector">
        <select class="season-select" id="season-select" onchange="CV.loadSeason(${show.id}, this.value)">
          ${seasonOpts}
        </select>
      </div>
      <div class="episodes-grid" id="episodes-grid">
        <div class="skeleton" style="height:70px;border-radius:8px"></div>
        <div class="skeleton" style="height:70px;border-radius:8px"></div>
        <div class="skeleton" style="height:70px;border-radius:8px"></div>
      </div>
    </div>
  `;
}

function buildEpisodes(showId, episodes = [], seasonNum = 1) {
  return episodes.map(ep => `
    <div class="episode-card" onclick="CV.navigate('watch/tv/${showId}/${seasonNum}/${ep.episode_number}')">
      <img class="ep-thumb" src="${ep.still_path ? tmdbImg(ep.still_path, 'w185') : 'https://via.placeholder.com/100x60/1a1a2e/666?text=EP'}" alt="Episode ${ep.episode_number}" loading="lazy" />
      <div class="ep-info">
        <div class="ep-num">Episode ${ep.episode_number}</div>
        <div class="ep-name">${ep.name || 'Episode ' + ep.episode_number}</div>
        ${ep.overview ? `<div class="ep-desc">${ep.overview}</div>` : ''}
      </div>
      <div class="ep-play-btn">
        <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      </div>
    </div>
  `).join('');
}

// ── Player Page ───────────────────────────────────────────
function buildPlayerPage(type, id, season, episode, title) {
  const sources = type === 'movie'
    ? [
      { label: 'VidSrc', url: `https://vidsrc.cc/v2/embed/movie/${id}` },
      { label: 'VidLink', url: `https://www.vidlink.pro/movie/${id}` },
      { label: 'Embed.su', url: `https://embed.su/embed/movie/${id}` },
      { label: 'AutoEmbed', url: `https://autoembed.co/movie/tmdb/${id}` },
      { label: 'SmashyStream', url: `https://player.smashy.stream/movie/${id}` },
      { label: 'VidSrc.me', url: `https://vidsrc.me/embed/movie?tmdb=${id}` },
      { label: 'MoviesAPI', url: `https://moviesapi.club/movie/${id}` },
      { label: 'NontonFilm', url: `https://nontonfilm.uno/embed/movie?tmdb=${id}` },
      { label: '2Embed', url: `https://www.2embed.cc/embed/${id}` },
      { label: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1` },
    ]
    : [
      { label: 'VidSrc', url: `https://vidsrc.cc/v2/embed/tv/${id}?season=${season}&episode=${episode}` },
      { label: 'VidLink', url: `https://www.vidlink.pro/tv/${id}/${season}/${episode}` },
      { label: 'Embed.su', url: `https://embed.su/embed/tv/${id}/${season}/${episode}` },
      { label: 'AutoEmbed', url: `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}` },
      { label: 'SmashyStream', url: `https://player.smashy.stream/tv/${id}?s=${season}&e=${episode}` },
      { label: 'VidSrc.me', url: `https://vidsrc.me/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
      { label: 'MoviesAPI', url: `https://moviesapi.club/tv/${id}-${season}-${episode}` },
      { label: 'NontonFilm', url: `https://nontonfilm.uno/embed/tv?tmdb=${id}&season=${season}&episode=${episode}` },
      { label: '2Embed', url: `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}` },
      { label: 'SuperEmbed', url: `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}` },
    ];

  const episodeInfo = type === 'tv' ? ` &middot; S${season} E${episode}` : '';
  const sourceBtns = sources.map((s, i) =>
    `<button class="source-btn ${i === 0 ? 'active' : ''}" onclick="CV.switchSource('${s.url}', this)">${s.label}</button>`
  ).join('');

  return `
    <div class="player-page" id="player-page">
      <div class="player-topbar">
        <div class="player-back" onclick="history.back()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </div>
        <div class="player-title">${title || ''}${episodeInfo}</div>
      </div>
      <iframe
        id="player-iframe"
        class="player-embed"
        src="${sources[0].url}"
        allowfullscreen
        referrerpolicy="no-referrer"
        allow="fullscreen; autoplay; picture-in-picture; encrypted-media"
        scrolling="no"
        frameborder="0"
      ></iframe>
      <div class="source-bar">
        <span class="source-label">Source:</span>
        ${sourceBtns}
      </div>
    </div>
    <script>
      // Block popup windows opened by embed players
      (function() {
        const _open = window.open.bind(window);
        window.open = function(url, name, features) {
          // Allow legitimate fullscreen/pip popups (blank target or undefined)
          if (!url || url === 'about:blank') return _open(url, name, features);
          // Block all other popup attempts silently
          return null;
        };
      })();
    </script>
  `;
}

// ── Browse Page ───────────────────────────────────────────
function buildBrowsePage(type, items, title, genreFilters = []) {
  const genres = [
    { label: 'All', value: 'all' },
    ...genreFilters,
  ];
  const filterHtml = genres.map((g, i) =>
    `<button class="filter-chip ${i === 0 ? 'active' : ''}" data-genre="${g.value}" onclick="CV.filterBrowse(this, '${type}', '${g.value}')">${g.label}</button>`
  ).join('');

  return `
    <div class="browse-page">
      <div class="browse-page-header">
        <h1 class="browse-page-title">${title}</h1>
        <div class="browse-filters" id="browse-filters">${filterHtml}</div>
      </div>
      <div class="browse-grid" id="browse-grid">
        ${items.map(item => buildCard({ ...item, media_type: type })).join('')}
      </div>
      <button class="load-more-btn" id="load-more-btn" onclick="CV.loadMoreBrowse('${type}')">
        Load More
      </button>
    </div>
  `;
}

// ── Search Results ────────────────────────────────────────
function buildSearchResults(items, query) {
  if (!items.length) {
    return `<div class="search-status">No results for "<strong>${query}</strong>"</div>`;
  }
  return items.map(item => buildCard(item)).join('');
}

// ── Watchlist Page ────────────────────────────────────────
function buildWatchlistPage(items) {
  const empty = `
    <div style="text-align:center;padding:80px 20px;color:var(--text-3)">
      <div style="font-size:48px;margin-bottom:16px">❤️</div>
      <div style="font-size:20px;font-weight:700;color:var(--text);margin-bottom:8px">Your watchlist is empty</div>
      <div style="font-size:14px">Save movies and shows to watch later</div>
    </div>
  `;
  return `
    <div class="browse-page">
      <div class="browse-page-header">
        <h1 class="browse-page-title">My Watchlist</h1>
      </div>
      ${items.length
      ? `<div class="browse-grid">${items.map(buildCard).join('')}</div>`
      : empty
    }
    </div>
  `;
}

// ── API Page ──────────────────────────────────────────────
function buildApiPage() {
  return `
    <div class="browse-page">
      <div class="browse-page-header">
        <h1 class="browse-page-title" style="display:flex;align-items:center;gap:12px">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="32" height="32"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          CineVibe API
        </h1>
      </div>
      <div style="max-width:720px;color:var(--text-2);line-height:1.8">
        <p style="margin-bottom:24px;font-size:16px">CineVibe uses the TMDB API for metadata and VidKing for streaming embeds. You can use these endpoints in your own projects.</p>

        <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Movie Player Embed</div>
          <code style="font-size:14px;color:#a5f3fc">https://www.vidking.net/embed/movie/{tmdb_id}</code>
        </div>

        <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;margin-bottom:20px">
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">TV Episode Embed</div>
          <code style="font-size:14px;color:#a5f3fc">https://www.vidking.net/embed/tv/{tmdb_id}/{season}/{episode}</code>
        </div>

        <div style="background:var(--bg-3);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px">
          <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">TMDB Metadata</div>
          <code style="font-size:14px;color:#a5f3fc">https://api.themoviedb.org/3/movie/{id}?api_key=YOUR_KEY</code>
        </div>
      </div>
    </div>
  `;
}
