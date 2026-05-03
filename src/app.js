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

  var PRINT_LAYOUT_MODES = {
    control: {
      label: 'Контрольный односторонний',
      sideMode: 'single',
      labelPlacement: 'side',
      labelWidthMm: 30,
      minCellHeightMm: 16,
      defaultGapMm: 3,
      defaultPaddingMm: 1,
      sectionHeightMm: 7
    },
    compact: {
      label: 'Компактный односторонний',
      sideMode: 'single',
      labelPlacement: 'below',
      labelWidthMm: 0,
      minCellHeightMm: 13,
      defaultGapMm: 1.5,
      defaultPaddingMm: 0.7,
      sectionHeightMm: 5
    },
    duplex: {
      label: 'Двусторонний',
      sideMode: 'duplex',
      labelPlacement: 'back',
      labelWidthMm: 0,
      minCellHeightMm: 10,
      defaultGapMm: 1.5,
      defaultPaddingMm: 0.9,
      sectionHeightMm: 5
    },
    scissors: {
      label: 'Домашняя резка ножницами',
      sideMode: 'single',
      labelPlacement: 'side',
      labelWidthMm: 28,
      minCellHeightMm: 18,
      defaultGapMm: 4,
      defaultPaddingMm: 1.4,
      sectionHeightMm: 7
    },
    plotter: {
      label: 'Плоттерная резка',
      sideMode: 'single',
      labelPlacement: 'none',
      labelWidthMm: 0,
      minCellHeightMm: 11,
      defaultGapMm: 1,
      defaultPaddingMm: 0.7,
      sectionHeightMm: 5
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
      layoutMode: elements.printMode.value,
      densityMode: elements.densityMode.value,
      cellWidthCustomMm: numberFromInput(elements.cellWidthMm, 0, 0, 80),
      cellHeightCustomMm: numberFromInput(elements.cellHeightMm, 0, 0, 80),
      minGapMm: numberFromInput(elements.minGapMm, 2, 0, 20),
      cellPaddingMm: numberFromInput(elements.cellPaddingMm, 1, 0, 10),
      cutBleedMm: numberFromInput(elements.cutBleedMm, 2, 0, 10),
      duplexEnabled: elements.duplexEnabled.value === 'on' || elements.printMode.value === 'duplex',
      duplexSide: elements.duplexSide.value,
      duplexFlip: elements.duplexFlip.value,
      duplexMirror: elements.duplexMirror.value,
      spareCount: Number(elements.spareCount.value),
      addTestMarker: elements.addTestMarker.checked,
      breakSections: elements.breakSections.checked,
      showName: elements.showName.checked,
      showId: elements.showId.checked,
      showGroup: elements.showGroup.checked,
      showArrow: elements.showArrow.checked,
      showCheckbox: elements.showCheckbox.checked,
      showCutLines: elements.showCutLines.checked,
      showStickerBounds: elements.showStickerBounds.checked,
      showSafeArea: elements.showSafeArea.checked,
      showRegistrationMarks: elements.showRegistrationMarks.checked,
      showBackingLabels: elements.showBackingLabels.checked
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
    var mode = PRINT_LAYOUT_MODES[settings.layoutMode] || PRINT_LAYOUT_MODES.control;
    var density = settings.densityMode;
    var densityGap = {
      off: settings.gapMm,
      normal: Math.min(settings.gapMm, Math.max(settings.minGapMm, mode.defaultGapMm)),
      tight: Math.min(settings.gapMm, Math.max(settings.minGapMm, mode.defaultGapMm * 0.65)),
      maximum: Math.min(settings.gapMm, settings.minGapMm)
    }[density] || settings.gapMm;
    var padding = settings.cellPaddingMm || mode.defaultPaddingMm;
    var bleed = settings.layoutMode === 'scissors' ? settings.cutBleedMm : 0;
    var markerBoxMm = maxMarkerSizeMm + padding * 2 + bleed * 2;
    var labelWidthMm = mode.labelWidthMm;
    var labelBelowMm = mode.labelPlacement === 'below' ? 5 : 0;
    var itemWidthMm = markerBoxMm + (labelWidthMm ? labelWidthMm + 1.5 : 0);
    var itemHeightMm = Math.max(markerBoxMm + labelBelowMm, mode.minCellHeightMm);

    if (settings.cellWidthCustomMm > 0) {
      itemWidthMm = Math.max(settings.cellWidthCustomMm, markerBoxMm);
    }
    if (settings.cellHeightCustomMm > 0) {
      itemHeightMm = Math.max(settings.cellHeightCustomMm, markerBoxMm);
    }

    var innerWidth = Math.max(1, settings.pageWidthMm - settings.marginMm * 2);
    var innerHeight = Math.max(1, settings.pageHeightMm - settings.marginMm * 2);
    var columns = Math.max(1, Math.floor((innerWidth + densityGap) / (itemWidthMm + densityGap)));
    var rows = Math.max(1, Math.floor((innerHeight + densityGap) / (itemHeightMm + densityGap)));

    return Object.assign({}, settings, {
      layoutLabel: mode.label,
      layoutSideMode: mode.sideMode,
      labelPlacement: mode.labelPlacement,
      maxMarkerSizeMm: maxMarkerSizeMm,
      labelWidthMm: labelWidthMm,
      itemWidthMm: itemWidthMm,
      itemHeightMm: itemHeightMm,
      effectiveGapMm: densityGap,
      effectivePaddingMm: padding,
      effectiveCutBleedMm: bleed,
      sectionHeightMm: mode.sectionHeightMm,
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
          y: settings.marginMm + row * (settings.itemHeightMm + settings.effectiveGapMm)
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
        x: settings.marginMm + col * (settings.itemWidthMm + settings.effectiveGapMm),
        y: settings.marginMm + row * (settings.itemHeightMm + settings.effectiveGapMm)
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

  function clonePageForSide(page, side, sourceIndex) {
    return {
      side: side,
      sourceIndex: sourceIndex,
      nodes: page.nodes
    };
  }

  function expandPrintPages(pages, settings) {
    var expanded = [];
    var duplexActive = settings.layoutSideMode === 'duplex' || settings.duplexEnabled;

    pages.forEach(function addSides(page, index) {
      if (!duplexActive) {
        expanded.push(clonePageForSide(page, 'single', index));
        return;
      }

      if (settings.duplexSide === 'front') {
        expanded.push(clonePageForSide(page, 'front', index));
      } else if (settings.duplexSide === 'back') {
        expanded.push(clonePageForSide(page, 'back', index));
      } else {
        expanded.push(clonePageForSide(page, 'front', index));
        expanded.push(clonePageForSide(page, 'back', index));
      }
    });

    return expanded.length ? expanded : [{ side: duplexActive ? 'front' : 'single', sourceIndex: 0, nodes: [] }];
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

  function shouldRenderBackMirrored(settings) {
    if (settings.duplexMirror === 'on') {
      return true;
    }
    if (settings.duplexMirror === 'off') {
      return false;
    }
    return settings.duplexFlip === 'long';
  }

  function getNodePrintPosition(node, settings, side) {
    var x = node.x;
    var y = node.y;
    if (side === 'back' && shouldRenderBackMirrored(settings)) {
      if (settings.duplexFlip === 'short') {
        y = settings.pageHeightMm - node.y - settings.itemHeightMm;
      } else {
        x = settings.pageWidthMm - node.x - settings.itemWidthMm;
      }
    }
    return { x: x, y: y };
  }

  function buildLabelParts(card, settings, compact) {
    var labelParts = [];
    if (settings.showCheckbox && !compact) {
      labelParts.push('<span class="paper-checkbox" aria-hidden="true"></span>');
    }
    if (settings.showId) {
      labelParts.push('<span class="label-id">ID ' + escapeHtml(card.displayId) + '</span>');
    }
    if (settings.showName) {
      labelParts.push('<strong>' + escapeHtml(card.name) + '</strong>');
    }
    if (settings.showGroup && !compact) {
      labelParts.push('<span>' + escapeHtml(card.group) + '</span>');
    }
    if (settings.showArrow) {
      labelParts.push('<span class="top-arrow">↑ верх карты</span>');
    }
    if (settings.showCheckbox && compact) {
      labelParts.push('<span class="paper-checkbox tiny" aria-hidden="true"></span>');
    }
    return labelParts;
  }

  function renderCardNode(node, settings, side) {
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var item = document.createElement('article');
    var position = getNodePrintPosition(node, settings, side);
    var isBack = side === 'back';
    var frontOnly = side === 'front' || side === 'single';
    var labelOnly = isBack;
    var compactLabel = settings.labelPlacement === 'below' || isBack;
    item.className = 'sheet-card sheet-card-' + settings.layoutMode + ' sheet-side-' + side + ' color-' + settings.colorMode;
    item.style.left = position.x + 'mm';
    item.style.top = position.y + 'mm';
    item.style.width = settings.itemWidthMm + 'mm';
    item.style.height = settings.itemHeightMm + 'mm';
    item.dataset.markerId = card.markerId;

    if (!settings.showCutLines) {
      item.classList.add('no-cut-lines');
    }

    var markerX = settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    var markerY = settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    if (settings.labelPlacement === 'side') {
      markerY = Math.max(settings.effectivePaddingMm, (settings.itemHeightMm - markerSize) / 2);
    }
    if (settings.labelPlacement === 'below') {
      markerX = Math.max(settings.effectivePaddingMm, (settings.itemWidthMm - markerSize) / 2);
    }
    var labelOffset = settings.labelPlacement === 'side' ? settings.maxMarkerSizeMm + settings.effectivePaddingMm * 2 + 1.5 : 0;
    var marker = global.CardMark.generateCardMark(card.markerId, {
      sizeMm: markerSize,
      colorMode: settings.colorMode,
      title: 'CardMark ' + card.displayId + ' ' + card.name
    });

    var html = [];
    if (settings.showCutLines) {
      html.push('<span class="cut-line" aria-hidden="true"></span>');
    }
    if (settings.showSafeArea) {
      html.push('<span class="safe-area" aria-hidden="true"></span>');
    }
    if (frontOnly && settings.showStickerBounds) {
      html.push('<span class="sticker-boundary" style="left:' + markerX + 'mm;top:' + markerY + 'mm;width:' + markerSize + 'mm;height:' + markerSize + 'mm" aria-hidden="true"></span>');
    }
    if (frontOnly) {
      html.push(
        '<div class="sticker-zone' + (settings.showStickerBounds ? '' : ' no-sticker-bounds') + '" style="left:' + markerX + 'mm;width:' + markerSize + 'mm;height:' + markerSize + 'mm;top:' + markerY + 'mm">',
        '<span class="sticker-top-cue" aria-hidden="true"></span>',
        marker,
        '</div>'
      );
    }
    if ((side === 'single' && settings.labelPlacement !== 'none' && settings.showBackingLabels) || labelOnly) {
      var labelClass = labelOnly ? 'paper-label label-on-back' : 'paper-label';
      var labelStyle = settings.labelPlacement === 'side' && !labelOnly
        ? 'left:' + labelOffset + 'mm'
        : 'left:0;right:0;top:' + (markerY + markerSize + 0.4) + 'mm;height:auto;text-align:center';
      if (labelOnly) {
        labelStyle = 'left:0;right:0;top:0;height:100%;text-align:center';
      }
      html.push('<div class="' + labelClass + '" style="' + labelStyle + '">', buildLabelParts(card, settings, compactLabel).join(''), '</div>');
    }

    item.innerHTML = html.join('');

    return item;
  }

  function renderSectionNode(node, settings, side) {
    var section = document.createElement('div');
    section.className = 'sheet-section-title';
    var position = getNodePrintPosition(node, settings, side);
    section.textContent = node.label;
    section.style.left = position.x + 'mm';
    section.style.top = position.y + 'mm';
    section.style.width = (settings.pageWidthMm - settings.marginMm * 2) + 'mm';
    section.style.height = settings.sectionHeightMm + 'mm';
    return section;
  }

  function renderRegistrationMarks(settings) {
    var fragment = document.createDocumentFragment();
    var positions = [
      [settings.marginMm / 2, settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, settings.marginMm / 2],
      [settings.marginMm / 2, settings.pageHeightMm - settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, settings.pageHeightMm - settings.marginMm / 2]
    ];

    positions.forEach(function addMark(position) {
      var mark = document.createElement('span');
      mark.className = 'registration-mark';
      mark.style.left = position[0] + 'mm';
      mark.style.top = position[1] + 'mm';
      fragment.appendChild(mark);
    });

    return fragment;
  }

  function getSideLabel(side) {
    if (side === 'front') {
      return 'FRONT / лицевая сторона';
    }
    if (side === 'back') {
      return 'BACK / оборотная сторона';
    }
    return 'PRINT / односторонний лист';
  }

  function renderPreview(payload) {
    var settings = payload.settings;
    elements.sheetPreview.innerHTML = '';

    payload.pages.forEach(function renderPage(page, index) {
      var pageElement = document.createElement('section');
      pageElement.className = 'print-sheet';
      pageElement.style.width = settings.pageWidthMm + 'mm';
      pageElement.style.height = settings.pageHeightMm + 'mm';
      pageElement.dataset.side = page.side;

      if (settings.showRegistrationMarks || settings.layoutMode === 'plotter' || settings.duplexEnabled) {
        pageElement.appendChild(renderRegistrationMarks(settings));
      }

      var sideLabel = document.createElement('div');
      sideLabel.className = 'page-side-label';
      sideLabel.textContent = getSideLabel(page.side);
      pageElement.appendChild(sideLabel);

      var pageNumber = document.createElement('div');
      pageNumber.className = 'page-number';
      pageNumber.textContent = (index + 1) + ' / ' + payload.pages.length;
      pageElement.appendChild(pageNumber);

      page.nodes.forEach(function renderNode(node) {
        pageElement.appendChild(node.type === 'section'
          ? renderSectionNode(node, settings, page.side)
          : renderCardNode(node, settings, page.side));
      });

      elements.sheetPreview.appendChild(pageElement);
    });

    elements.previewTitle.textContent = settings.testSheetMode ? 'Тестовый лист CardMark' : settings.deckLabel;
    elements.previewMeta.textContent = payload.cards.length + ' меток · ' + payload.pages.length + ' печ. стр. · ' + settings.layoutLabel + ' · ' + settings.label;
    elements.statusLine.textContent = 'Готово: ' + payload.cards.length + ' меток, ' + settings.columns + '×' + settings.rows + ' на сторону. Для двусторонней печати сначала сделайте тест на обычной бумаге, 100% scale, без масштабирования.';
  }

  function buildPayload() {
    var settings = readSettings();
    var cardResult = buildCards(settings);
    var layoutSettings = calculateLayout(settings, cardResult.cards);
    var entries = makeEntries(layoutSettings, cardResult.cards);
    var basePages = paginate(entries, layoutSettings);
    var pages = expandPrintPages(basePages, layoutSettings);

    return {
      settings: layoutSettings,
      cards: cardResult.cards,
      basePages: basePages,
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
      'densityMode',
      'cellWidthMm',
      'cellHeightMm',
      'minGapMm',
      'cellPaddingMm',
      'cutBleedMm',
      'duplexEnabled',
      'duplexSide',
      'duplexFlip',
      'duplexMirror',
      'showName',
      'showId',
      'showGroup',
      'showArrow',
      'showCheckbox',
      'showCutLines',
      'showStickerBounds',
      'showSafeArea',
      'showRegistrationMarks',
      'showBackingLabels',
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
      'densityMode',
      'cellWidthMm',
      'cellHeightMm',
      'minGapMm',
      'cellPaddingMm',
      'cutBleedMm',
      'duplexEnabled',
      'duplexSide',
      'duplexFlip',
      'duplexMirror',
      'showName',
      'showId',
      'showGroup',
      'showArrow',
      'showCheckbox',
      'showCutLines',
      'showStickerBounds',
      'showSafeArea',
      'showRegistrationMarks',
      'showBackingLabels',
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

  global.CardMarkApp = {
    PAGE_FORMATS: PAGE_FORMATS,
    PRINT_LAYOUT_MODES: PRINT_LAYOUT_MODES,
    _calculateLayout: calculateLayout,
    _paginate: paginate,
    _expandPrintPages: expandPrintPages
  };

  document.addEventListener('DOMContentLoaded', function boot() {
    cacheElements();
    bindControls();
    refresh();
  });
})(window);
