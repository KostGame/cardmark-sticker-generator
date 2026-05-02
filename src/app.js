(function attachCardMarkApp(global) {
  'use strict';

  var PAGE_FORMATS = {
    'a4-portrait': {
      label: 'A4 portrait',
      pageWidthMm: 210,
      pageHeightMm: 297,
      pdfFormat: 'a4',
      orientation: 'portrait',
      pageCss: 'A4 portrait'
    },
    'a4-landscape': {
      label: 'A4 landscape',
      pageWidthMm: 297,
      pageHeightMm: 210,
      pdfFormat: 'a4',
      orientation: 'landscape',
      pageCss: 'A4 landscape'
    },
    'letter-portrait': {
      label: 'Letter portrait',
      pageWidthMm: 215.9,
      pageHeightMm: 279.4,
      pdfFormat: 'letter',
      orientation: 'portrait',
      pageCss: 'letter portrait'
    },
    'letter-landscape': {
      label: 'Letter landscape',
      pageWidthMm: 279.4,
      pageHeightMm: 215.9,
      pdfFormat: 'letter',
      orientation: 'landscape',
      pageCss: 'letter landscape'
    }
  };

  var elements = {};
  var currentPayload = null;

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function numberFromInput(input, fallback, min, max) {
    var value = Number(input.value);
    if (!Number.isFinite(value)) {
      value = fallback;
    }
    return Math.max(min, Math.min(max, value));
  }

  function readSettings() {
    var format = PAGE_FORMATS[elements.pageFormat.value] || PAGE_FORMATS['a4-portrait'];
    var sizeValue = elements.markerSize.value;
    var markerSizeMm = sizeValue === 'custom'
      ? numberFromInput(elements.customSize, 8, 4, 24)
      : Number(sizeValue);

    return Object.assign({}, format, {
      deckType: elements.deckType.value,
      deckLabel: global.CardMarkPresets.decks[elements.deckType.value].label,
      testSheetMode: elements.testSheetMode.checked,
      markerSizeMm: global.CardMark.clampMarkerSize(markerSizeMm),
      colorMode: elements.colorMode.value,
      marginMm: numberFromInput(elements.pageMargin, 10, 0, 40),
      gapMm: numberFromInput(elements.itemGap, 4, 0, 20),
      printMode: elements.printMode.value,
      spareCount: Number(elements.spareCount.value),
      addTestMarker: elements.addTestMarker.checked,
      breakSections: elements.breakSections.checked,
      showName: elements.showName.checked,
      showId: elements.showId.checked,
      showGroup: elements.showGroup.checked,
      showArrow: elements.showArrow.checked,
      showCheckbox: elements.showCheckbox.checked,
      showCutLines: elements.showCutLines.checked,
      showStickerBounds: elements.showStickerBounds.checked
    });
  }

  function buildTestSheetCards() {
    var sizes = [6, 8, 10, 12];
    var cards = [];
    sizes.forEach(function addSize(size) {
      for (var copy = 1; copy <= 3; copy += 1) {
        var markerId = cards.length;
        cards.push({
          id: markerId,
          markerId: markerId,
          displayId: String(markerId).padStart(2, '0'),
          group: 'Тестовый лист',
          name: 'Визуальный тест ' + size + ' мм #' + copy,
          markerSizeMm: size
        });
      }
    });
    return cards;
  }

  function addSpareCards(cards, count, warnings) {
    for (var index = 0; index < count; index += 1) {
      var markerId = cards.length ? Math.max.apply(null, cards.map(function getMarkerId(card) {
        return card.markerId;
      })) + 1 : 0;

      if (markerId > 127) {
        warnings.push('Запасная метка #' + (index + 1) + ' пропущена: CardMark v0 поддерживает ID только до 127.');
        continue;
      }

      cards.push({
        id: markerId,
        markerId: markerId,
        displayId: String(markerId).padStart(2, '0'),
        group: 'Запасные',
        name: 'Запасная метка ' + (index + 1)
      });
    }
  }

  function addOptionalTestMarker(cards, warnings) {
    var used = {};
    cards.forEach(function remember(card) {
      used[card.markerId] = true;
    });

    if (used[127]) {
      warnings.push('Тестовая метка не добавлена: ID 127 уже используется.');
      return;
    }

    cards.push({
      id: 127,
      markerId: 127,
      displayId: '127',
      group: 'Тест',
      name: 'Тестовая метка'
    });
  }

  function buildCards(settings) {
    var warnings = [];
    var cards;
    var parseResult;

    if (settings.testSheetMode) {
      return {
        cards: buildTestSheetCards(),
        warnings: warnings
      };
    }

    if (settings.deckType === 'custom') {
      parseResult = global.CardMarkPresets.parseCustomCards(elements.customCards.value);
      cards = parseResult.cards;
      warnings = warnings.concat(parseResult.errors);
    } else {
      cards = global.CardMarkPresets.decks[settings.deckType].makeCards();
    }

    cards = cards.slice();
    addSpareCards(cards, settings.spareCount, warnings);
    if (settings.addTestMarker) {
      addOptionalTestMarker(cards, warnings);
    }

    if (!cards.length) {
      warnings.push('Нет карт для печати. Выберите пресет или заполните кастомный список.');
    }

    return {
      cards: cards,
      warnings: warnings
    };
  }

  function getSectionOrder(settings, cards) {
    var deck = global.CardMarkPresets.decks[settings.deckType];
    var order = settings.testSheetMode ? ['Тестовый лист'] : (deck.sections || []);
    var seen = {};

    order.forEach(function mark(section) {
      seen[section] = true;
    });

    cards.forEach(function addUnknown(card) {
      if (!seen[card.group]) {
        seen[card.group] = true;
        order.push(card.group);
      }
    });

    return order;
  }

  function makeEntries(settings, cards) {
    if (!settings.breakSections) {
      return cards.map(function asCard(card) {
        return { type: 'card', card: card };
      });
    }

    var entries = [];
    var order = getSectionOrder(settings, cards);
    order.forEach(function addSection(section) {
      var sectionCards = cards.filter(function inSection(card) {
        return card.group === section;
      });
      if (!sectionCards.length) {
        return;
      }

      entries.push({ type: 'section', label: section });
      sectionCards.forEach(function addCard(card) {
        entries.push({ type: 'card', card: card });
      });
    });

    return entries;
  }

  function calculateLayout(settings, cards) {
    var maxMarkerSizeMm = cards.reduce(function findMax(maxSize, card) {
      return Math.max(maxSize, card.markerSizeMm || settings.markerSizeMm);
    }, settings.markerSizeMm);
    var labelWidthMm = settings.printMode === 'production' ? 33 : 42;
    var itemWidthMm = maxMarkerSizeMm + 2 + labelWidthMm;
    var itemHeightMm = Math.max(maxMarkerSizeMm + 2, settings.printMode === 'production' ? 15 : 19);
    var innerWidth = Math.max(1, settings.pageWidthMm - settings.marginMm * 2);
    var innerHeight = Math.max(1, settings.pageHeightMm - settings.marginMm * 2);
    var columns = Math.max(1, Math.floor((innerWidth + settings.gapMm) / (itemWidthMm + settings.gapMm)));
    var rows = Math.max(1, Math.floor((innerHeight + settings.gapMm) / (itemHeightMm + settings.gapMm)));

    return Object.assign({}, settings, {
      maxMarkerSizeMm: maxMarkerSizeMm,
      labelWidthMm: labelWidthMm,
      itemWidthMm: itemWidthMm,
      itemHeightMm: itemHeightMm,
      innerWidthMm: innerWidth,
      innerHeightMm: innerHeight,
      columns: columns,
      rows: rows,
      capacity: columns * rows
    });
  }

  function paginate(entries, settings) {
    var pages = [];
    var page = { nodes: [] };
    var row = 0;
    var col = 0;

    function pushPage() {
      if (page.nodes.length) {
        pages.push(page);
      }
      page = { nodes: [] };
      row = 0;
      col = 0;
    }

    entries.forEach(function addEntry(entry) {
      if (entry.type === 'section') {
        if (col > 0) {
          row += 1;
          col = 0;
        }
        if (row >= settings.rows) {
          pushPage();
        }
        page.nodes.push({
          type: 'section',
          label: entry.label,
          row: row,
          col: 0,
          x: settings.marginMm,
          y: settings.marginMm + row * (settings.itemHeightMm + settings.gapMm)
        });
        row += 1;
        col = 0;
        return;
      }

      if (row >= settings.rows) {
        pushPage();
      }

      page.nodes.push({
        type: 'card',
        card: entry.card,
        row: row,
        col: col,
        x: settings.marginMm + col * (settings.itemWidthMm + settings.gapMm),
        y: settings.marginMm + row * (settings.itemHeightMm + settings.gapMm)
      });

      col += 1;
      if (col >= settings.columns) {
        row += 1;
        col = 0;
      }
    });

    pushPage();
    return pages.length ? pages : [{ nodes: [] }];
  }

  function makeManifest(payload) {
    return {
      format: global.CardMark.FORMAT_NAME,
      version: global.CardMark.VERSION,
      deckType: payload.settings.deckType,
      deckLabel: payload.settings.testSheetMode ? 'Тестовый лист' : payload.settings.deckLabel,
      markerSizeMm: payload.settings.markerSizeMm,
      cards: payload.cards.map(function serialize(card) {
        return {
          id: card.id,
          group: card.group,
          name: card.name,
          markerId: card.markerId
        };
      })
    };
  }

  function updatePrintPageStyle(settings) {
    var style = byId('printPageStyle');
    if (!style) {
      style = document.createElement('style');
      style.id = 'printPageStyle';
      document.head.appendChild(style);
    }
    style.textContent = '@page { size: ' + settings.pageCss + '; margin: 0; }';
  }

  function renderWarnings(warnings) {
    elements.warningList.innerHTML = '';
    warnings.forEach(function addWarning(warning) {
      var item = document.createElement('p');
      item.textContent = warning;
      elements.warningList.appendChild(item);
    });
  }

  function renderCardNode(node, settings) {
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var item = document.createElement('article');
    item.className = 'sheet-card sheet-card-' + settings.printMode + ' color-' + settings.colorMode;
    item.style.left = node.x + 'mm';
    item.style.top = node.y + 'mm';
    item.style.width = settings.itemWidthMm + 'mm';
    item.style.height = settings.itemHeightMm + 'mm';
    item.dataset.markerId = card.markerId;

    if (!settings.showCutLines) {
      item.classList.add('no-cut-lines');
    }

    var markerY = Math.max(0, (settings.itemHeightMm - markerSize) / 2);
    var labelOffset = settings.maxMarkerSizeMm + 2;
    var marker = global.CardMark.generateCardMark(card.markerId, {
      sizeMm: markerSize,
      colorMode: settings.colorMode,
      title: 'CardMark ' + card.displayId + ' ' + card.name
    });

    var labelParts = [];
    if (settings.showCheckbox) {
      labelParts.push('<span class="paper-checkbox" aria-hidden="true"></span>');
    }
    if (settings.showId) {
      labelParts.push('<span class="label-id">ID ' + escapeHtml(card.displayId) + '</span>');
    }
    if (settings.showName) {
      labelParts.push('<strong>' + escapeHtml(card.name) + '</strong>');
    }
    if (settings.showGroup) {
      labelParts.push('<span>' + escapeHtml(card.group) + '</span>');
    }
    if (settings.showArrow) {
      labelParts.push('<span class="top-arrow">↑ верх карты</span>');
    }

    item.innerHTML = [
      '<div class="sticker-zone' + (settings.showStickerBounds ? '' : ' no-sticker-bounds') + '" style="width:' + markerSize + 'mm;height:' + markerSize + 'mm;top:' + markerY + 'mm">',
      '<span class="sticker-top-cue" aria-hidden="true"></span>',
      marker,
      '</div>',
      '<div class="paper-label" style="left:' + labelOffset + 'mm">',
      labelParts.join(''),
      '</div>'
    ].join('');

    return item;
  }

  function renderSectionNode(node, settings) {
    var section = document.createElement('div');
    section.className = 'sheet-section-title';
    section.textContent = node.label;
    section.style.left = node.x + 'mm';
    section.style.top = node.y + 'mm';
    section.style.width = (settings.pageWidthMm - settings.marginMm * 2) + 'mm';
    section.style.height = settings.itemHeightMm + 'mm';
    return section;
  }

  function renderPreview(payload) {
    var settings = payload.settings;
    elements.sheetPreview.innerHTML = '';

    payload.pages.forEach(function renderPage(page, index) {
      var pageElement = document.createElement('section');
      pageElement.className = 'print-sheet';
      pageElement.style.width = settings.pageWidthMm + 'mm';
      pageElement.style.height = settings.pageHeightMm + 'mm';

      var pageNumber = document.createElement('div');
      pageNumber.className = 'page-number';
      pageNumber.textContent = (index + 1) + ' / ' + payload.pages.length;
      pageElement.appendChild(pageNumber);

      page.nodes.forEach(function renderNode(node) {
        pageElement.appendChild(node.type === 'section'
          ? renderSectionNode(node, settings)
          : renderCardNode(node, settings));
      });

      elements.sheetPreview.appendChild(pageElement);
    });

    elements.previewTitle.textContent = settings.testSheetMode ? 'Тестовый лист CardMark' : settings.deckLabel;
    elements.previewMeta.textContent = payload.cards.length + ' меток · ' + payload.pages.length + ' стр. · ' + settings.label;
    elements.statusLine.textContent = 'Готово: ' + payload.cards.length + ' меток, ' + settings.columns + '×' + settings.rows + ' на страницу.';
  }

  function buildPayload() {
    var settings = readSettings();
    var cardResult = buildCards(settings);
    var layoutSettings = calculateLayout(settings, cardResult.cards);
    var entries = makeEntries(layoutSettings, cardResult.cards);
    var pages = paginate(entries, layoutSettings);

    return {
      settings: layoutSettings,
      cards: cardResult.cards,
      pages: pages,
      warnings: cardResult.warnings,
      manifest: null
    };
  }

  function refresh() {
    currentPayload = buildPayload();
    currentPayload.manifest = makeManifest(currentPayload);
    updatePrintPageStyle(currentPayload.settings);
    renderWarnings(currentPayload.warnings);
    renderPreview(currentPayload);
    elements.customDeckField.hidden = elements.deckType.value !== 'custom';
    elements.customSizeField.hidden = elements.markerSize.value !== 'custom';
  }

  function notify(message) {
    elements.statusLine.textContent = message;
  }

  function bindControls() {
    [
      'deckType',
      'testSheetMode',
      'customCards',
      'markerSize',
      'customSize',
      'colorMode',
      'pageFormat',
      'pageMargin',
      'itemGap',
      'printMode',
      'showName',
      'showId',
      'showGroup',
      'showArrow',
      'showCheckbox',
      'showCutLines',
      'showStickerBounds',
      'breakSections',
      'spareCount',
      'addTestMarker'
    ].forEach(function bind(id) {
      var eventName = id === 'customCards' ? 'input' : 'change';
      elements[id].addEventListener(eventName, refresh);
    });

    elements.downloadSvg.addEventListener('click', function onDownloadSvg() {
      global.CardMarkExporter.downloadSvg(currentPayload);
      notify('SVG скачан.');
    });

    elements.downloadPdf.addEventListener('click', function onDownloadPdf() {
      global.CardMarkExporter.downloadPdf(currentPayload, notify);
    });

    elements.printSheet.addEventListener('click', function onPrint() {
      global.CardMarkExporter.printCurrent();
    });

    elements.downloadJson.addEventListener('click', function onDownloadJson() {
      global.CardMarkExporter.downloadManifest(currentPayload.manifest);
      notify('JSON-манифест скачан.');
    });
  }

  function cacheElements() {
    [
      'deckType',
      'testSheetMode',
      'customDeckField',
      'customCards',
      'markerSize',
      'customSizeField',
      'customSize',
      'colorMode',
      'pageFormat',
      'pageMargin',
      'itemGap',
      'printMode',
      'showName',
      'showId',
      'showGroup',
      'showArrow',
      'showCheckbox',
      'showCutLines',
      'showStickerBounds',
      'breakSections',
      'spareCount',
      'addTestMarker',
      'downloadSvg',
      'downloadPdf',
      'printSheet',
      'downloadJson',
      'statusLine',
      'sheetPreview',
      'previewTitle',
      'previewMeta',
      'warningList'
    ].forEach(function cache(id) {
      elements[id] = byId(id);
    });
  }

  document.addEventListener('DOMContentLoaded', function boot() {
    cacheElements();
    bindControls();
    refresh();
  });
})(window);
