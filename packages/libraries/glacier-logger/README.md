# @glacier/logger

Private, native ESM structured logger for Node and browsers. The package is currently a wired scaffold with no
public API; see `.plan/` for the roadmap.

Single public entry `"."` with conditional exports: `browser` resolves to `dist/index.browser.js`, everything else
to `dist/index.js`.
