/**
 * `npm run web`: the Expo web build in a browser, talking to the EasyEquity API.
 *
 * The API only allows the website's own domains (CORS), so a page served from
 * http://localhost:8081 can't call it directly — the phone app can, because
 * native apps aren't subject to CORS. This starts a small proxy on this
 * computer that forwards /api/* to the API and adds CORS headers for localhost
 * pages only, then starts Expo web pointed at it.
 *
 *   npm run web                      proxy → production API, then Expo web
 *   npm run web -- --port 8090       extra arguments go to `expo start`
 *   API_TARGET=http://localhost:3001 npm run web   proxy to a local backend instead
 *   node scripts/web-dev.mjs --proxy-only           just the proxy
 */
import { spawn } from "node:child_process"
import http from "node:http"
import https from "node:https"

const TARGET = new URL(process.env.API_TARGET || "https://easy-equity.onrender.com")
const PORT = Number(process.env.API_PROXY_PORT || 3999)
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/
// Hop-by-hop and browser-only headers that must not be forwarded as-is.
const SKIP_REQUEST = new Set(["host", "origin", "referer", "connection", "keep-alive", "upgrade", "proxy-connection", "transfer-encoding"])

function corsHeaders(origin) {
  if (!origin || !LOCAL_ORIGIN.test(origin)) return {}
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "access-control-max-age": "7200",
    vary: "Origin",
  }
}

const server = http.createServer((req, res) => {
  const origin = req.headers.origin
  const cors = corsHeaders(origin)

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      ...cors,
      "access-control-allow-headers": req.headers["access-control-request-headers"] || "Authorization, Content-Type, Accept",
    })
    return res.end()
  }
  if (!req.url?.startsWith("/api/")) {
    res.writeHead(404, { ...cors, "content-type": "application/json" })
    return res.end(JSON.stringify({ error: "Only /api/* is proxied." }))
  }

  const headers = {}
  for (const [k, v] of Object.entries(req.headers)) if (!SKIP_REQUEST.has(k) && v !== undefined) headers[k] = v
  headers.host = TARGET.host

  const client = TARGET.protocol === "https:" ? https : http
  const upstream = client.request(
    { protocol: TARGET.protocol, hostname: TARGET.hostname, port: TARGET.port || undefined, method: req.method, path: req.url, headers, timeout: 90_000 },
    (up) => {
      const out = { ...up.headers }
      // Replace the API's own CORS answer (which doesn't list localhost) with ours.
      for (const k of Object.keys(out)) if (k.startsWith("access-control-")) delete out[k]
      res.writeHead(up.statusCode || 502, { ...out, ...cors })
      up.pipe(res)
    },
  )
  upstream.on("timeout", () => upstream.destroy(new Error("timeout")))
  upstream.on("error", (err) => {
    if (res.headersSent) return res.destroy()
    res.writeHead(502, { ...cors, "content-type": "application/json" })
    res.end(JSON.stringify({ error: `Can't reach ${TARGET.origin} (${err.message}).` }))
  })
  req.pipe(upstream)
})

server.on("error", (err) => {
  console.error(err.code === "EADDRINUSE" ? `Port ${PORT} is already in use (set API_PROXY_PORT to use another).` : err)
  process.exit(1)
})

// Localhost only: nothing else on the network can use the proxy.
server.listen(PORT, "127.0.0.1", () => {
  console.log(`[web-dev] API proxy http://localhost:${PORT}/api → ${TARGET.origin}/api`)
  if (process.argv.includes("--proxy-only")) return

  const expo = spawn("npx", ["expo", "start", "--web", ...process.argv.slice(2)], {
    stdio: "inherit",
    shell: process.platform === "win32",
    // Set in the environment, this wins over EXPO_PUBLIC_API_URL in .env.local.
    env: { ...process.env, EXPO_PUBLIC_API_URL: `http://localhost:${PORT}/api` },
  })
  expo.on("exit", (code) => {
    server.close()
    process.exit(code ?? 0)
  })
})
