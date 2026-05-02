# AGENTS.md

## Project Rules

- This is a static web application. Keep it runnable from `index.html` without a build step.
- Do not add a backend, external API, OCR, AI model, neural-network dependency or server-side processing.
- Prefer plain HTML, CSS and JavaScript. Optional CDN libraries are allowed only when the browser-print fallback remains usable.
- The UI language is Russian.
- Preserve GitHub Pages compatibility from the repository root.

## Documentation Discipline

- Keep `README.md`, `CHANGELOG.md` and `AGENTS.md` in the repository.
- Update `CHANGELOG.md` every time code changes are committed.
- Update `README.md` when user-visible behavior, setup, export format or CardMark v0 changes.
- Keep CardMark v0 documented in both code and README.

## CardMark V0

- Marker IDs are limited to integers from `0` to `127`.
- `generateCardMark(id, options)` must remain deterministic.
- Rendering modes may change colors, but must not change the logical 7x7 matrix.
- The sticker itself should contain only the machine-readable mark and a small top cue; human-readable information belongs on the backing sheet.
