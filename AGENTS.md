# AGENTS.md

This file is the main working protocol for Codex and future agents working on CardMark Sticker Generator.

## Before Starting Any Task

- Read `README.md`, `AGENTS.md` and every file in `docs/` before making changes.
- Confirm the current branch, PR context and working tree state.
- Prefer the smallest static change that satisfies the task.
- Do not start a new PR or branch unless the user explicitly asks for it.

## Project Rules

- This is a static web application. Keep it runnable from `index.html` without a build step.
- The application must work on GitHub Pages.
- Do not add a backend, server-side processing or server-only workflow.
- Do not use AI, neural networks, OCR, external APIs or server processing.
- Prefer plain HTML, CSS and JavaScript.
- If an external library is loaded through a CDN, a browser-native fallback must remain available.
- The application UI must stay in Russian.
- The printable sheet must remain suitable for PDF/browser printing.
- When in doubt, choose a simple static solution.
- Do not start or implement the recognition application in this repository.
- Recognition work belongs in a separate `card-reader` repository.

## Documentation Discipline

- Keep `README.md`, `CHANGELOG.md`, `AGENTS.md` and `docs/*` in the repository.
- Do not delete or rewrite project documents unless the task clearly requires it.
- Record all substantial decisions in `docs/DECISIONS.md`.
- Record all changes in `CHANGELOG.md`.
- Update `README.md` after each PR when structure, setup, features, limitations, export behavior or CardMark changes.
- Update `docs/ROADMAP.md` after each PR when the plan changes.
- Write every PR report strictly using `docs/PR_REPORT_TEMPLATE.md`.
- Keep CardMark v0 documented in both code and `docs/CARDMARK_SPEC.md`.

## CardMark V0

- Marker IDs are limited to integers from `0` to `127`.
- `generateCardMark(id, options)` must remain deterministic.
- Rendering modes may change colors, but must not change the logical 7x7 matrix.
- The sticker itself should contain only the machine-readable mark and a small top cue.
- Human-readable information belongs on the backing sheet.
- Do not change CardMark v0 without a new entry in `docs/DECISIONS.md` and an update to `docs/CARDMARK_SPEC.md`.
- Do not change CardMark v0 only to support print layout changes; keep layout behavior separate from marker encoding.

## Recognition App Boundary

- `cardmark-sticker-generator` is only for generating printable sticker sheets and JSON manifests.
- Do not add camera access, image analysis, marker detection, orientation detection or card recognition here.
- If a task asks for recognition behavior, confirm that it should be done in the separate `card-reader` repository.

## Pull Request Hygiene

- Keep PRs focused.
- Do not add unrelated user-facing functionality while doing documentation, governance or process work.
- Before committing, verify that `README.md`, `CHANGELOG.md`, `AGENTS.md` and relevant `docs/*` files are consistent with the change.
- Before opening or updating a PR, run available project checks such as `npm run check`.
- If a check was not run, state that clearly in the PR report with the reason.
- If code changes are included, explain why they were necessary in the PR report.
- When changing print layout behavior, update `docs/CHECKS.md` with manual checks for affected modes.
