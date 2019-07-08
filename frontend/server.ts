import "zone.js/dist/zone-node";
import { enableProdMode } from "@angular/core";
// Express Engine
import { ngExpressEngine } from "@nguniversal/express-engine";
// Import module map for lazy loading
import { provideModuleMap } from "@nguniversal/module-map-ngfactory-loader";

import * as express from "express";
import { join } from "path";
import { readFileSync } from "fs";

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 4000;
const DIST_FOLDER = join(process.cwd(), "dist/browser");

const supportedLocales = ["en", "fr"];
const DEFAULT_LOCALE = "fr";
const MockBrowser = require("mock-browser").mocks.MockBrowser;
const mock = new MockBrowser();
const domino = require("domino");
const template = readFileSync(
  join(DIST_FOLDER, DEFAULT_LOCALE, "index.html")
).toString();
const win = domino.createWindow(template);
win.Object = Object;
win.Math = Math;
win.screen = { deviceXDPI: 1 };
global["window"] = win;
global["document"] = win.document;
global["navigator"] = mock.getNavigator();
global["branch"] = null;
global["object"] = win.object;
global["HTMLElement"] = win.HTMLElement;
global["DOMTokenList"] = win.DOMTokenList;
global["Node"] = win.Node;
global["Text"] = win.Text;
global["localStorage"] = win.localStorage = mock.getLocalStorage();
global["L"] = require("leaflet");

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const {
  AppServerModuleNgFactory,
  LAZY_MODULE_MAP
} = require("./dist/server/main");

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine(
  "html",
  ngExpressEngine({
    bootstrap: AppServerModuleNgFactory,
    providers: [provideModuleMap(LAZY_MODULE_MAP)]
  })
);

app.set("view engine", "html");
app.set("views", DIST_FOLDER);

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });
// Serve static files from /browser
app.get(
  "*.*",
  express.static(DIST_FOLDER, {
    maxAge: "1y"
  })
);

// All regular routes use the Universal engine
app.get("*", (req, res) => {
  const matches = req.url.match(/^\/([a-z]{2}(?:-[A-Z]{2})?)\//);
  // check if the requested url has a correct format '/locale' and matches any of the supportedLocales
  const locale =
    matches && supportedLocales.indexOf(matches[1]) !== -1
      ? matches[1]
      : DEFAULT_LOCALE;

  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  if (ip.substr(0, 7) === "::ffff:") {
    ip = ip.substr(7);
  }
  // res.render("index", { req });
  res.render(`${locale}/index`, {
    req: req,
    url: req.url.replace(`/${locale}/`, "/"),
    providers: [
      { provide: "language", useFactory: () => locale, deps: [] },
      { provide: "ip", useFactory: () => ip, deps: [] }
    ]
  });
});

// Start up the Node server
app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);
});
