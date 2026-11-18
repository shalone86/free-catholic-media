// Free Catholic Media hub on methodiusmedia.com, plus redirect-only hostnames.
// Every redirect is a 301 that keeps the path, so old links and search
// rankings carry over instead of turning into 404s.

import { KIDS_HOME, KIDS_PAGES } from './kids-redirects.js';

const REDIRECTS = {
  'www.methodiusmedia.com': 'https://methodiusmedia.com',
  'gallery.methodiusmedia.com': 'https://sdcason.com',
  'courses.sdcason.com': 'https://catholiccourses.org',
  'rosary.methodiusmedia.com': 'https://illuminatedrosary.org',
  'illuminatedrosary.com': 'https://illuminatedrosary.org',
  'www.illuminatedrosary.com': 'https://illuminatedrosary.org',
};

// Files that belong to the hub. Anything else on methodiusmedia.com is an old
// link from when it mirrored the music site, so it goes to methodius.media.
const HUB_PATHS = /^\/(index\.html|robots\.txt|sitemap\.xml|img\/[\w-]+\.webp|fonts\/[\w-]+\.woff2)?$/;

// methodiusmedia.com used to serve the music site's service worker. This
// replacement clears its caches and unregisters it for returning visitors.
const RETIRED_SW = `self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
    .then(() => self.registration.unregister())
));
`;

// The kids videos and songs moved to Angelio (angelio.org/watch/). Each old page goes to the
// lesson, song, course or album that replaced it; old video, picture and PDF links go to the
// same file in Angelio's media; anything else goes to the Watch & Sing home.
const KIDS_HOSTS = new Set(['kids.sdcason.com']);

function kidsTarget(url) {
  if (url.pathname.startsWith('/content/')) return KIDS_HOME + 'media/' + url.pathname.slice('/content/'.length);
  const path = decodeURIComponent(url.pathname).replace(/\/+$/, '').toLowerCase() || '/';
  const page = KIDS_PAGES[path];
  if (page === undefined) return KIDS_HOME;
  return /^https?:/.test(page) ? page : KIDS_HOME + page;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (KIDS_HOSTS.has(url.hostname)) return Response.redirect(kidsTarget(url), 301);
    const target = REDIRECTS[url.hostname];
    if (target) return Response.redirect(target + url.pathname + url.search, 301);

    if (url.pathname === '/sw.js') {
      return new Response(RETIRED_SW, {
        headers: { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-cache' },
      });
    }
    if (HUB_PATHS.test(url.pathname)) return env.ASSETS.fetch(request);
    return Response.redirect('https://methodius.media' + url.pathname + url.search, 301);
  },
};
