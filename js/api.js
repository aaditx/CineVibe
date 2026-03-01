/**
 * CineVibe — TMDB API Module
 * All calls go through tmdb() which injects the API key and handles errors.
 */

const TMDB_KEY = '8265bd1679663a7ea12ac168da84d2e8';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG_BASE = 'https://image.tmdb.org/t/p';

// Genre IDs (Movies)
const MOVIE_GENRES = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35,
  Crime: 80, Drama: 18, Fantasy: 14, Horror: 27,
  Mystery: 9648, Romance: 10749, SciFi: 878, Thriller: 53,
};

// Genre IDs (TV)
const TV_GENRES = {
  Action: 10759, Animation: 16, Comedy: 35, Crime: 80,
  Drama: 18, Mystery: 9648, Reality: 10764, SciFi: 10765,
};

// Network IDs
const NETWORKS = {
  Netflix: 213, Amazon: 1024, Hulu: 453, Disney: 2739, HBO: 49, Apple: 2552,
};

/**
 * Build TMDB image URL
 * @param {string} path - e.g. "/abc123.jpg"
 * @param {'w92'|'w154'|'w185'|'w342'|'w500'|'w780'|'w1280'|'original'} size
 */
function tmdbImg(path, size = 'w500') {
  if (!path) return 'https://via.placeholder.com/300x450/1a1a2e/e5173f?text=No+Image';
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

function tmdbBackdrop(path, size = 'w1280') {
  if (!path) return '';
  return `${TMDB_IMG_BASE}/${size}${path}`;
}

/** Core fetch wrapper */
async function tmdb(path, params = {}) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set('api_key', TMDB_KEY);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  try {
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`TMDB error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[TMDB]', err.message, path);
    return { results: [], total_results: 0 };
  }
}

// ── TRENDING ──────────────────────────────────────────────
async function getTrending(type = 'all', window = 'day') {
  const data = await tmdb(`/trending/${type}/${window}`);
  return (data.results || []).map(item => ({
    ...item,
    media_type: item.media_type || type,
  }));
}

// ── TOP RATED ─────────────────────────────────────────────
async function getTopRated(type = 'movie', page = 1) {
  const data = await tmdb(`/${type}/top_rated`, { page });
  return (data.results || []).map(item => ({ ...item, media_type: type }));
}

// ── POPULAR ───────────────────────────────────────────────
async function getPopular(type = 'movie', page = 1) {
  const data = await tmdb(`/${type}/popular`, { page });
  return (data.results || []).map(item => ({ ...item, media_type: type }));
}

// ── NOW PLAYING / ON THE AIR ──────────────────────────────
async function getNowPlaying() {
  const data = await tmdb('/movie/now_playing');
  return (data.results || []).map(item => ({ ...item, media_type: 'movie' }));
}

async function getOnTheAir() {
  const data = await tmdb('/tv/on_the_air');
  return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
}

// ── BY GENRE ──────────────────────────────────────────────
async function getByGenre(type = 'movie', genreId, page = 1) {
  const data = await tmdb(`/discover/${type}`, {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
  });
  return (data.results || []).map(item => ({ ...item, media_type: type }));
}

// ── BY NETWORK ────────────────────────────────────────────
async function getByNetwork(networkId, page = 1) {
  const data = await tmdb('/discover/tv', {
    with_networks: networkId,
    sort_by: 'popularity.desc',
    page,
  });
  return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
}

// ── ANIME ─────────────────────────────────────────────────
async function getAnime(page = 1) {
  const data = await tmdb('/discover/tv', {
    with_genres: 16,
    with_origin_country: 'JP',
    sort_by: 'popularity.desc',
    page,
  });
  return (data.results || []).map(item => ({ ...item, media_type: 'tv' }));
}

// ── DETAILS ───────────────────────────────────────────────
async function getMovieDetails(id) {
  return await tmdb(`/movie/${id}`, { append_to_response: 'credits,recommendations,videos,similar' });
}

async function getTVDetails(id) {
  return await tmdb(`/tv/${id}`, { append_to_response: 'credits,recommendations,videos,similar' });
}

async function getTVSeason(id, seasonNumber) {
  return await tmdb(`/tv/${id}/season/${seasonNumber}`);
}

// ── SEARCH ────────────────────────────────────────────────
async function searchMulti(query, page = 1) {
  if (!query || query.length < 2) return [];
  const data = await tmdb('/search/multi', { query, page, include_adult: false });
  return (data.results || []).filter(i => i.media_type !== 'person');
}

// ── VIDEOS / TRAILER ──────────────────────────────────────
async function getVideos(type, id) {
  const data = await tmdb(`/${type}/${id}/videos`);
  const results = data.results || [];
  const trailer = results.find(v => v.type === 'Trailer' && v.site === 'YouTube')
    || results.find(v => v.site === 'YouTube');
  return trailer ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1` : null;
}

// ── CREDITS ───────────────────────────────────────────────
async function getCredits(type, id) {
  const data = await tmdb(`/${type}/${id}/credits`);
  return data.cast || [];
}

// ── RECOMMENDATIONS ───────────────────────────────────────
async function getRecommendations(type, id) {
  const data = await tmdb(`/${type}/${id}/recommendations`);
  return (data.results || []).map(item => ({ ...item, media_type: type }));
}

// ── HELPERS ───────────────────────────────────────────────
function getTitle(item) {
  return item.title || item.name || 'Unknown';
}

function getYear(item) {
  const date = item.release_date || item.first_air_date || '';
  return date ? date.split('-')[0] : '';
}

function getRating(item) {
  return item.vote_average ? item.vote_average.toFixed(1) : 'N/A';
}

function getGenreNames(genreIds = [], type = 'movie') {
  const allGenres = type === 'movie'
    ? Object.entries(MOVIE_GENRES)
    : Object.entries(TV_GENRES);
  return genreIds
    .map(id => {
      const found = allGenres.find(([, gid]) => gid === id);
      return found ? found[0] : null;
    })
    .filter(Boolean)
    .slice(0, 2);
}
