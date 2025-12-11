#!/usr/bin/env node
const http = require('http')
const url  = require('url')

const targets = { fr: 4200, en: 4201, de: 4202 }
const DEFAULT = 'fr'
const PORT    = 4300

http.createServer((req, res) => {
  const parsed   = url.parse(req.url)
  const seg      = (parsed.pathname||'/').split('/')[1]
  const isRootOrMissingLocale = !targets[seg]

  // ——> si on est à la racine ou qu’aucune locale n’est détectée, on redirige
  if (parsed.pathname === '/' || isRootOrMissingLocale && parsed.pathname.split('/').length === 2) {
    // conserve query + hash
    const suffix = (parsed.search||'') + (parsed.hash||'')
    res.writeHead(302, { Location: `/${DEFAULT}/${parsed.pathname.replace(/^\/+/,'')}${suffix}` })
    return res.end()
  }

  // on a une locale valide : on la proxy
  const locale = seg
  const target = { host: '127.0.0.1', port: targets[locale] }
  const path   = parsed.path

  const proxyReq = http.request({
    hostname: target.host,
    port:     target.port,
    method:   req.method,
    path,
    headers:  req.headers
  }, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })

  req.pipe(proxyReq).on('error', err => {
    console.error('Proxy error:', err)
    res.writeHead(502)
    res.end('Bad gateway')
  })
}).listen(PORT, () => {
  console.log(`🌍  i18n proxy en écoute sur http://localhost:${PORT} (fr→4200, en→4201, de→4202)`)
})
