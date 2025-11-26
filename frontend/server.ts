import 'zone.js/dist/zone-node';
import { enableProdMode } from '@angular/core';
// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import { join } from 'path';
import { readFileSync, readdirSync, statSync } from 'fs';
import { AppConfig } from './src/conf/app.config';

// Faster server renders w/ Prod mode
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), 'dist/browser');

// Liste de toutes les locales possibles
const ALL_LOCALES = AppConfig.supportedLocales || ["fr", "en", "de"];
const DEFAULT_LOCALE = AppConfig.defaultLocale || 'fr';

// Détecte quels sous-dossiers existe réellement sous dist/browser
const actualFolders = readdirSync(DIST_FOLDER).filter(name => {
  const p = join(DIST_FOLDER, name);
  return statSync(p).isDirectory();
});

// Ne retenir que ceux qui sont dans ALL_LOCALES
let supportedLocales = actualFolders.filter(loc => ALL_LOCALES.includes(loc));
// Si aucun sous-dossier, on est en mono-locale
if (supportedLocales.length === 0) {
  supportedLocales = [DEFAULT_LOCALE];
}
// Vérification config vs build
if (ALL_LOCALES.length > 1 && supportedLocales.length < ALL_LOCALES.length) {
  console.error('Build error: expected locale folders ' + ALL_LOCALES.join(', ') + ' but found ' + supportedLocales.join(', ') + '. You may need to run `npm run build:i18n-ssr in case of multi-locale or change `supportedLocales` in app.config.ts to deploy mono locale.');
  process.exit(1);
}
const isMulti = supportedLocales.length > 1;

// Charger et mocker window/document pour SSR
const MockBrowser = require('mock-browser').mocks.MockBrowser;
const mock = new MockBrowser();
const domino = require('domino');

// Sélection du template index.html
const templatePath = isMulti
  ? join(DIST_FOLDER, DEFAULT_LOCALE, 'index.html')
  : join(DIST_FOLDER, 'index.html');
const template = readFileSync(templatePath).toString();

const win = domino.createWindow(template);
Object.assign(win, {
  Object,
  Math,
  screen: { deviceXDPI: 1 }
});
global['window'] = win;
global['document'] = win.document;
global['navigator'] = mock.getNavigator();
global['localStorage'] = mock.getLocalStorage();
global['HTMLElement'] = win.HTMLElement;
global['HTMLAnchorElement'] = win.HTMLAnchorElement;
global['DOMTokenList'] = win.DOMTokenList;
global['Node'] = win.Node;
global['Text'] = win.Text;
global['L'] = require('leaflet');

// Bundle server-side (Webpack)
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP,
} = require('./dist/server/main');

// Setup Express engine
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [provideModuleMap(LAZY_MODULE_MAP)]
}));
app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Serve static assets
app.get('*.*', express.static(DIST_FOLDER, { maxAge: '1y' }));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  if (isMulti) {
    // Multi-locale: URL comme /fr/chemin
    const matches = req.url.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
    const locale = (matches && supportedLocales.includes(matches[1]))
      ? matches[1]
      : DEFAULT_LOCALE;

    // Ajuste URL interne pour Angular
    const internalUrl = req.url.replace(`/${locale}/`, '/');

    return res.render(`${locale}/index`, {
      req,
      url: internalUrl,
      providers: [
        { provide: 'language', useFactory: () => locale, deps: [] }
      ]
    });
  }

  // Mono-locale: toujours servir index.html à la racine
  return res.render('index', {
    req,
    url: req.url,
    providers: [
      { provide: 'language', useFactory: () => DEFAULT_LOCALE, deps: [] }
    ]
  });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
