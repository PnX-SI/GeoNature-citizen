// tools/dev-i18n-proxy.ts
/* DEV‐ONLY proxy:
   /fr → :4200   /en → :4201   /de → :4202 */

const express   = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const targets = { fr: 'http://localhost:4200',
                  en: 'http://localhost:4201',
                  de: 'http://localhost:4202' };

const consoleLogger = { debug: console.debug.bind(console),
                        info:  console.info.bind(console),
                        warn:  console.warn.bind(console),
                        error: console.error.bind(console) };

function pickLocaleFromPath(path = '/') {
  const seg = path.split('/')[1];
  return targets[seg] ? seg : 'fr';        // default to French
}

function pickLocaleFromReferer(req) {
  const ref = req.headers.referer || '';
  return pickLocaleFromPath(new URL(ref, 'http://x').pathname);
}

const app = express();

/* ① redirect bare “/” to default locale*/
app.get('/', (_req, res) => res.redirect('/fr'));

/* ② main proxy – decides target for *every* request */
app.use((req, res, next) => {
  // decide by path *or* (if no locale) by Referer
  const firstSeg = req.path.split('/')[1];
  const locale = targets[firstSeg] ? firstSeg : pickLocaleFromReferer(req);
  const target = targets[locale];

  return createProxyMiddleware({
    target,
    changeOrigin: true,
    logger: consoleLogger,
  })(req, res, next);
});

app.listen(4300, () =>
  console.log('🌍  i18n proxy on http://localhost:4300  (fr→4200 en→4201 de→4202)')
);