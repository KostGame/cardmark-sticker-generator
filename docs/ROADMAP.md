# Roadmap

## Status: Generator v0 Completed

CardMark Sticker Generator v0.1.0 is considered a working generator for static sticker sheets, print/export workflows and JSON manifests. The project is ready to pause before work moves to the separate `card-reader` repository.

## Completed

### PR-000: Initial Generator Prototype

- Static single-page application.
- Deck presets.
- Printable sheet preview.
- CardMark v0.
- SVG/PDF/print/JSON export.
- Baseline README, CHANGELOG, AGENTS and project documentation.
- Governance baseline: project brief, CardMark specification, decisions log, roadmap and PR report template.

### PR-001: Stabilization and GitHub Pages Publishing

- GitHub Pages publishing guidance.
- Minimal local checks without a build step.
- Relative asset path verification for Pages compatibility.
- Documentation for checks and development workflow.

### PR-002: Print Layout Modes and Duplex Sheets

- Control, compact, duplex, scissors and plotter print modes.
- Front/back pages for duplex printing.
- Registration marks, cut lines, safe area and SVG layer classes.
- SVG/JSON/CardMark regression checks for new layout modes.

### Hotfix: Production Cache Busting

- Cache-busting query strings for CSS and JavaScript assets on GitHub Pages.
- Check script updated to accept relative asset paths with query strings.

## Future Generator Improvements

- Real printer calibration workflow and printable calibration sheets.
- PDF typography improvements, especially Cyrillic rendering through `jsPDF`.
- SVG plotter presets for common cutting workflows.
- Packaging or publishing improvements for broader distribution.

## Future: Separate `card-reader` Project

The next major stage is not part of this repository. It should live in a separate `card-reader` repository and focus on:

- camera access in the browser;
- CardMark search in image frames;
- `markerId` detection;
- orientation detection;
- matching detected IDs with JSON manifests from this generator;
- manual result correction.
