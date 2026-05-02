# Checks

This project remains a static application. Checks are for development confidence only and do not introduce a build step.

## Open Locally

Open `index.html` directly in a browser.

The app should load from relative paths:

- `styles/main.css`
- `src/presets.js`
- `src/cardmark.js`
- `src/export.js`
- `src/app.js`

No local server is required for the main application flow.

## Run Static Checks

Use Node.js to run the local project checks:

```bash
npm run check
```

The check script has no external dependencies. It verifies:

- required static files exist;
- JavaScript syntax can be parsed;
- `index.html` uses relative asset paths suitable for GitHub Pages;
- Tarot 78 contains 78 cards;
- playing cards 36 contains 36 cards;
- playing cards 54 contains 54 cards;
- generated CardMark matrices are deterministic;
- marker IDs outside `0..127` throw `RangeError`;
- a minimal JSON manifest can be serialized and parsed;
- the SVG export helper returns a printable SVG document.

## Check Presets Manually

1. Open `index.html`.
2. Select `Таро 78` and confirm the preview reports 78 marks.
3. Select `Игральные 36` and confirm the preview reports 36 marks.
4. Select `Игральные 54` and confirm the preview reports 54 marks.
5. Select `Кастомный набор`, enter `001;Группа;Название`, and confirm the preview updates.

## Check SVG Export

1. Open `index.html`.
2. Select a deck.
3. Click `Скачать SVG`.
4. Open the downloaded `cardmark-stickers.svg`.
5. Confirm that the sheet contains CardMark markers and backing-sheet labels.

## Check JSON Export

1. Open `index.html`.
2. Select a deck.
3. Click `Скачать JSON`.
4. Open `cardmark-manifest.json`.
5. Confirm that it contains `format`, `version`, `deckType`, `markerSizeMm` and `cards`.

## Check PDF Fallback

1. Open `index.html`.
2. Click `Печать / PDF`.
3. Use the browser print dialog to save as PDF.
4. Confirm that the printable sheet uses real page dimensions and visible markers.

The `Скачать PDF` button depends on the optional `jsPDF` CDN. If the CDN is blocked or unavailable, browser printing remains the required fallback.

## Not Automated Yet

- Browser UI interaction tests.
- Real printer calibration.
- Pixel-perfect print layout validation.
- PDF typography and Cyrillic rendering across browsers.
- GitHub Pages deployment verification.
- Camera recognition, because the recognition app is not implemented.
