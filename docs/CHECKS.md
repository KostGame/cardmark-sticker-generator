# Checks

This project remains a static application. Checks are for development confidence only and do not introduce a build step.

## Open Locally

Open `index.html` directly in a browser. No local server is required for the main application flow.

The app should load static assets from relative paths. Cache-busting query strings are allowed:

- `styles/main.css?v=...`
- `src/presets.js?v=...`
- `src/cardmark.js?v=...`
- `src/export.js?v=...`
- `src/app.js?v=...`

## Run Static Checks

Use Node.js to run the local project checks:

```bash
npm run check
```

On Windows:

```powershell
npm.cmd run check
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
- SVG export returns printable SVG;
- layout modes are available;
- duplex front/back SVGs build without breaking label placement;
- plotter SVG contains expected layer classes.

## Check GitHub Pages

Open:

https://kostgame.github.io/cardmark-sticker-generator/

Confirm the page contains:

- `Компактный односторонний`;
- `Двусторонний`;
- `Лицевая сторона с метками`;
- `Оборотная сторона с подписями`;
- `Обе стороны`;
- `Домашняя резка ножницами`;
- `Плоттерная резка`.

If the UI looks stale after a merge, hard refresh the page:

- Windows/Linux: `Ctrl+F5`;
- macOS: `Cmd+Shift+R`.

The HTML should include cache-busting query strings for CSS and JS assets.

## Check Presets Manually

1. Open `index.html` or GitHub Pages.
2. Select `Таро 78` and confirm the preview reports 78 marks.
3. Select `Игральные 36` and confirm the preview reports 36 marks.
4. Select `Игральные 54` and confirm the preview reports 54 marks.
5. Select `Кастомный набор`, enter `001;Группа;Название`, and confirm the preview updates.

## Check Print Layout Modes

### Control

1. Select `Контрольный односторонний`.
2. Confirm the readable control sheet still renders.

### Compact

1. Select `Компактный односторонний`.
2. Confirm that cells are denser than the control layout.
3. Confirm labels are short and do not create a large side panel.

### Duplex Front

1. Select `Двусторонний`.
2. Set side to `Лицевая сторона с метками`.
3. Confirm the sheet shows markers, top cues, cut/sticker boundaries and registration marks.
4. Confirm human-readable labels are not printed on the front.

### Duplex Back

1. Select `Двусторонний`.
2. Set side to `Оборотная сторона с подписями`.
3. Confirm the sheet shows ID, name, group/suit, top arrow and checkbox on matching positions.

### Duplex Both

1. Select `Двусторонний`.
2. Set side to `Обе стороны`.
3. Confirm pages alternate front/back.
4. Print a test on ordinary paper before using sticker stock.

### Scissors

1. Select `Домашняя резка ножницами`.
2. Confirm visible dashed cut lines and larger cut allowance.
3. Confirm stickers do not overlap and labels remain readable.

### Plotter

1. Select `Плоттерная резка`.
2. Confirm registration marks, cut lines and safe area are visible.
3. Export SVG and inspect layer classes:
   - `layer-markers`;
   - `layer-cut-lines`;
   - `layer-backing-labels`;
   - `layer-registration-marks`;
   - `layer-page-labels`.

## Check SVG Export

1. Open `index.html` or GitHub Pages.
2. Select a deck and print mode.
3. Click `Скачать SVG`.
4. Open the downloaded `cardmark-stickers.svg`.
5. Confirm that the selected print mode is reflected in the exported sheet.

Repeat at least once for compact, duplex front, duplex back, scissors and plotter modes.

## Check JSON Export

1. Open `index.html` or GitHub Pages.
2. Select a deck.
3. Click `Скачать JSON`.
4. Open `cardmark-manifest.json`.
5. Confirm that it contains `format`, `version`, `deckType`, `markerSizeMm` and `cards`.

JSON export format must not change unless the task explicitly requires it.

## Check PDF Fallback

1. Open `index.html` or GitHub Pages.
2. Click `Печать / PDF`.
3. Use the browser print dialog to save as PDF.
4. Use 100% scale and disable `fit to page`.
5. Confirm that the printable sheet uses real page dimensions and visible markers.

The `Скачать PDF` button depends on optional `jsPDF` from CDN. If the CDN is blocked or unavailable, browser printing remains the required fallback.

## Regression Checks

- JSON export format must remain unchanged.
- CardMark v0 logical matrix and `markerId` range must remain unchanged.
- `npm run check` or `npm.cmd run check` must pass before PR review.
- GitHub Pages must keep using `main` and `/root`.

## Not Automated Yet

- Full browser UI interaction tests.
- Real printer calibration.
- Pixel-perfect print layout validation.
- PDF typography and Cyrillic rendering across browsers.
- Camera recognition, because the recognition app belongs in the future `card-reader` project.
