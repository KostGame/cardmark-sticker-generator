import fs from 'node:fs';
import vm from 'node:vm';

const rootFiles = [
  'index.html',
  'styles/main.css',
  'src/cardmark.js',
  'src/presets.js',
  'src/export.js',
  'src/app.js'
];

const sourceFiles = [
  'src/cardmark.js',
  'src/presets.js',
  'src/export.js',
  'src/app.js'
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function loadBrowserScripts(files) {
  const context = {
    console,
    Blob: class BlobMock {},
    URL: {
      createObjectURL() {
        return 'blob:cardmark-check';
      },
      revokeObjectURL() {}
    },
    document: {
      addEventListener() {},
      getElementById() {
        return null;
      },
      head: {
        appendChild() {}
      },
      createElement() {
        return {
          click() {},
          remove() {}
        };
      },
      body: {
        appendChild() {}
      }
    },
    print() {}
  };

  context.window = context;
  vm.createContext(context);

  files.forEach((file) => {
    vm.runInContext(fs.readFileSync(file, 'utf8'), context, { filename: file });
  });

  return context;
}

function checkFilesExist() {
  rootFiles.forEach((file) => {
    assert(fs.existsSync(file), `Missing required file: ${file}`);
  });
}

function checkScriptSyntax() {
  sourceFiles.forEach((file) => {
    new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file });
  });
}

function checkRelativeAssets() {
  const html = fs.readFileSync('index.html', 'utf8');
  assert(/href="styles\/main\.css(?:\?[^"]*)?"/.test(html), 'index.html must reference styles/main.css relatively.');
  ['src/presets.js', 'src/cardmark.js', 'src/export.js', 'src/app.js'].forEach((file) => {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace('/', '\\/');
    assert(new RegExp(`src="${escaped}(?:\\\\?[^"]*)?"`).test(html), `index.html must reference ${file} relatively.`);
  });
}

function checkDeckPresets(context) {
  const decks = context.CardMarkPresets.decks;
  assert(decks.tarot78.makeCards().length === 78, 'Tarot 78 preset must contain 78 cards.');
  assert(decks.playing36.makeCards().length === 36, 'Playing 36 preset must contain 36 cards.');
  assert(decks.playing54.makeCards().length === 54, 'Playing 54 preset must contain 54 cards.');

  Object.entries(decks).forEach(([deckName, deck]) => {
    if (deckName === 'custom') {
      return;
    }

    deck.makeCards().forEach((card) => {
      assert(Number.isInteger(card.markerId), `${deckName} markerId must be an integer.`);
      assert(card.markerId >= 0 && card.markerId <= 127, `${deckName} markerId ${card.markerId} is outside 0..127.`);
    });
  });
}

function checkCardMark(context) {
  const a = JSON.stringify(context.CardMark.buildMarkerMatrix(42));
  const b = JSON.stringify(context.CardMark.buildMarkerMatrix(42));
  assert(a === b, 'generateCardMark/buildMarkerMatrix must be deterministic.');

  assert(context.CardMark.generateCardMark(42, { sizeMm: 8 }).includes('data-cardmark-id="42"'), 'SVG marker must include marker id.');
  assert(context.CardMark.buildPayloadBits(127).length === 21, 'CardMark v0 payload must contain 21 bits.');

  let lowError = false;
  let highError = false;
  try {
    context.CardMark.generateCardMark(-1);
  } catch (error) {
    lowError = error.name === 'RangeError';
  }
  try {
    context.CardMark.generateCardMark(128);
  } catch (error) {
    highError = error.name === 'RangeError';
  }
  assert(lowError, 'markerId below 0 must throw RangeError.');
  assert(highError, 'markerId above 127 must throw RangeError.');
}

function checkManifestShape(context) {
  const cards = context.CardMarkPresets.decks.tarot78.makeCards().slice(0, 2);
  const manifest = {
    format: context.CardMark.FORMAT_NAME,
    version: context.CardMark.VERSION,
    deckType: 'tarot78',
    markerSizeMm: 8,
    cards: cards.map((card) => ({
      id: card.id,
      group: card.group,
      name: card.name,
      markerId: card.markerId
    }))
  };

  const serialized = JSON.stringify(manifest);
  const parsed = JSON.parse(serialized);
  assert(parsed.format === 'CardMark', 'Manifest format must be CardMark.');
  assert(parsed.version === '0.1', 'Manifest version must be 0.1.');
  assert(parsed.cards.length === 2, 'Minimal manifest must include test cards.');
  assert(parsed.cards[0].markerId === 0, 'Manifest must preserve markerId.');
}

function checkSvgExport(context) {
  const card = context.CardMarkPresets.decks.tarot78.makeCards()[0];
  const payload = makeExportPayload(context, 'control', 'single', card);

  const svg = context.CardMarkExporter._buildSvg(payload);
  assert(svg.includes('<svg'), 'SVG export helper must return an SVG document.');
  assert(svg.includes('data-page="1"'), 'SVG export must include page marker.');
  assert(svg.includes('layer-markers'), 'SVG export must include marker layer.');
  assert(svg.includes('Шут'), 'SVG export must include card label.');
}

function makeExportPayload(context, layoutMode, side, card) {
  const mode = context.CardMarkApp.PRINT_LAYOUT_MODES[layoutMode];
  assert(mode, `Missing layout mode: ${layoutMode}`);

  return {
    settings: {
      pageWidthMm: 210,
      pageHeightMm: 297,
      marginMm: 10,
      gapMm: 4,
      itemWidthMm: 52,
      itemHeightMm: 19,
      maxMarkerSizeMm: 8,
      markerSizeMm: 8,
      effectivePaddingMm: 1,
      effectiveCutBleedMm: layoutMode === 'scissors' ? 2 : 0,
      colorMode: 'dark-on-light',
      layoutMode,
      layoutLabel: mode.label,
      labelPlacement: mode.labelPlacement,
      duplexEnabled: layoutMode === 'duplex',
      duplexFlip: 'long',
      duplexMirror: 'auto',
      showCutLines: true,
      showStickerBounds: true,
      showSafeArea: true,
      showRegistrationMarks: true,
      showBackingLabels: true,
      showCheckbox: true,
      showId: true,
      showName: true,
      showGroup: true,
      showArrow: true
    },
    pages: [
      {
        side,
        nodes: [
          {
            type: 'card',
            card,
            x: 10,
            y: 10
          }
        ]
      }
    ]
  };
}

function checkLayoutModes(context) {
  const expectedModes = ['control', 'compact', 'duplex', 'scissors', 'plotter'];
  const modes = context.CardMarkApp.PRINT_LAYOUT_MODES;
  const card = context.CardMarkPresets.decks.tarot78.makeCards()[0];

  expectedModes.forEach((mode) => {
    assert(modes[mode], `Layout mode must be available: ${mode}`);
    const side = mode === 'duplex' ? 'front' : 'single';
    const svg = context.CardMarkExporter._buildSvg(makeExportPayload(context, mode, side, card));
    assert(svg.includes('<svg'), `${mode} SVG must build.`);
  });

  const duplexFront = context.CardMarkExporter._buildSvg(makeExportPayload(context, 'duplex', 'front', card));
  const duplexBack = context.CardMarkExporter._buildSvg(makeExportPayload(context, 'duplex', 'back', card));
  assert(duplexFront.includes('FRONT /'), 'Duplex front SVG must include front page label.');
  assert(duplexBack.includes('BACK /'), 'Duplex back SVG must include back page label.');
  assert(!duplexFront.includes('ID '), 'Duplex front SVG must not include human-readable labels.');
  assert(duplexBack.includes('ID '), 'Duplex back SVG must include human-readable labels.');

  const plotter = context.CardMarkExporter._buildSvg(makeExportPayload(context, 'plotter', 'single', card));
  ['layer-markers', 'layer-cut-lines', 'layer-backing-labels', 'layer-registration-marks', 'layer-page-labels'].forEach((layer) => {
    assert(plotter.includes(layer), `Plotter SVG must include ${layer}.`);
  });
}

checkFilesExist();
checkScriptSyntax();
checkRelativeAssets();

const context = loadBrowserScripts(['src/cardmark.js', 'src/presets.js', 'src/export.js', 'src/app.js']);
checkDeckPresets(context);
checkCardMark(context);
checkManifestShape(context);
checkSvgExport(context);
checkLayoutModes(context);

console.log('CardMark project checks passed.');
