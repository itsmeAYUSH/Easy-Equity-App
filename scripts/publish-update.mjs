/**
 * `npm run update:preview` / `npm run update:production`: send the current
 * JavaScript, styles and images to installed builds on that channel with
 * EAS Update — no new APK. Native changes (a new native package, app.json
 * native settings, icons, an SDK upgrade) still need `npm run build:apk`.
 *
 * `eas update` bundles on this computer, so EXPO_PUBLIC_* would otherwise come
 * from .env.local, which may point at a local API. This sets them from the
 * matching build profile in eas.json first (values already in the shell win
 * over .env files), so an update talks to the same backend as its build.
 *
 *   npm run update:preview                       message = last commit subject
 *   npm run update:preview -- "Fix login copy"   your own message
 *   npm run update:preview -- "Fix" --platform android   extra flags go to `eas update`
 */
import { execSync, spawnSync } from "node:child_process"
import { readFileSync } from "node:fs"

const [channel, ...rest] = process.argv.slice(2)
const eas = JSON.parse(readFileSync(new URL("../eas.json", import.meta.url), "utf8"))
const profiles = eas.build ?? {}

const profileName = Object.keys(profiles).find((name) => resolve(name).channel === channel)
if (!channel || !profileName) {
  const channels = [...new Set(Object.keys(profiles).map((name) => resolve(name).channel).filter(Boolean))]
  console.error(`Usage: node scripts/publish-update.mjs <channel> ["message"] [eas update flags]\nChannels in eas.json: ${channels.join(", ")}`)
  process.exit(1)
}

/** A build profile with its `extends` chain applied (env merged, nearest wins). */
function resolve(name, seen = new Set()) {
  const profile = profiles[name] ?? {}
  if (!profile.extends || seen.has(name)) return profile
  seen.add(name)
  const parent = resolve(profile.extends, seen)
  return { ...parent, ...profile, env: { ...parent.env, ...profile.env } }
}

const git = (cmd) => {
  try {
    return execSync(`git ${cmd}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    return ""
  }
}

const hasMessage = rest.length > 0 && !rest[0].startsWith("-")
const message = (hasMessage ? rest.shift() : git("log -1 --format=%s")) || `Update ${new Date().toISOString()}`
if (git("status --porcelain")) {
  console.warn("Note: uncommitted changes are included in this update.\n")
}

// Keep the message one safe shell argument on both cmd.exe and POSIX shells.
const safeMessage = message.replace(/["%$`!\\\r\n]/g, "").slice(0, 200)
const env = { ...process.env, ...resolve(profileName).env }

console.log(`Publishing to channel "${channel}" (env from eas.json "${profileName}"): ${safeMessage}\n`)
const result = spawnSync(`eas update --channel ${channel} --message "${safeMessage}" ${rest.join(" ")}`, {
  stdio: "inherit",
  shell: true,
  env,
})
process.exit(result.status ?? 1)
