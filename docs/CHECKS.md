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

Repeat SVG export for these print modes:

- `Контрольный односторонний`;
- `Компактный односторонний`;
- `Двусторонний` with front, back and both sides;
- `Домашняя резка ножницами`;
- `Плоттерная резка`.

For plotter mode, inspect the SVG for layer classes:

- `layer-markers`;
- `layer-cut-lines`;
- `layer-backing-labels`;
- `layer-registration-marks`;
- `layer-page-labels`.

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

## Check Print Layout Modes

### Compact

1. Select `Компактный односторонний`.
2. Confirm that cells are denser than the control layout.
3. Confirm that labels are short and do not create a large side panel.

### Duplex Front

1. Select `Двусторонний`.
2. Set side to `Лицевая сторона с метками`.
3. Confirm that the sheet shows markers, top cues, cut/sticker boundaries and registration marks.

### Duplex Back

1. Select `Двусторонний`.
2. Set side to `Оборотная сторона с подписями`.
3. Confirm that the sheet shows labels on matching positions and includes `BACK / оборотная сторона`.

### Duplex Both

1. Select `Двусторонний`.
2. Set side to `Обе стороны`.
3. Confirm that pages alternate front/back.
4. Print a test on ordinary paper before using sticker stock.

### Scissors

1. Select `Домашняя резка ножницами`.
2. Confirm visible dashed cut lines and larger cut allowance.
3. Confirm labels remain readable.

### Plotter

1. Select `Плоттерная резка`.
2. Confirm registration marks, cut lines and safe area are visible.
3. Export SVG and inspect layer classes.

## Regression Checks

- JSON export format must remain unchanged.
- CardMark v0 logical matrix and `markerId` range must remain unchanged.
- `npm run check` or `npm.cmd run check` must pass before PR review.

## Not Automated Yet

- Browser UI interaction tests.
- Real printer calibration.
- Pixel-perfect print layout validation.
- PDF typography and Cyrillic rendering across browsers.
- GitHub Pages deployment verification.
- Camera recognition, because the recognition app is not implemented.
