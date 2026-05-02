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

## Pull Request Hygiene

- Keep PRs focused.
- Do not add unrelated user-facing functionality while doing documentation, governance or process work.
- Before committing, verify that `README.md`, `CHANGELOG.md`, `AGENTS.md` and relevant `docs/*` files are consistent with the change.
- If code changes are included, explain why they were necessary in the PR report.
