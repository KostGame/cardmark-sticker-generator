# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Initial static CardMark Sticker Generator application.
- Russian UI for deck presets, sticker settings, page layout, preview, print and export.
- CardMark v0 deterministic 7x7 SVG marker format with marker IDs from 0 to 127.
- Presets for Tarot 78, playing cards 36, playing cards 54 and custom card lists.
- SVG, optional PDF, browser print and JSON manifest export.
- Project documentation, Apache-2.0 license and agent instructions.
- Project governance docs in docs/.
- GitHub Pages publishing guidance.
- Local project checks.
- Print layout modes for control, compact, duplex, scissors and plotter workflows.
- Duplex front/back sheet rendering with registration marks.
- SVG layer classes for markers, cut lines, backing labels, registration marks and page labels.

### Changed
- Clarified the roadmap so PR-001 is stabilization after the PR-000 governance baseline, not a repeat of document creation.
- Print layout generation now supports denser cells, cut bleed and mode-specific label placement.

### Fixed
- Duplex front sheets no longer render human-readable backing labels.
