(function attachCardMarkExporter(global) {
  'use strict';

  function escapeXml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function downloadBlob(filename, content, type) {
    var blob = content instanceof Blob ? content : new Blob([content], { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function compactText(value, maxLength) {
    var text = String(value);
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, Math.max(1, maxLength - 1)) + '…';
  }

  function drawMarkerSvg(markerId, x, y, size, colorMode) {
    var matrix = global.CardMark.buildMarkerMatrix(markerId);
    var palette = global.CardMark.getPalette(colorMode);
    var cell = size / global.CardMark.GRID_SIZE;
    var parts = [];

    if (palette.hasBackground) {
      parts.push('<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="' + palette.background + '"/>');
    }

    parts.push('<g fill="' + palette.foreground + '">');
    matrix.forEach(function drawRow(row, rowIndex) {
      row.forEach(function drawCell(value, colIndex) {
        if (value === 1) {
          parts.push('<rect x="' + (x + colIndex * cell).toFixed(3) + '" y="' + (y + rowIndex * cell).toFixed(3) + '" width="' + cell.toFixed(3) + '" height="' + cell.toFixed(3) + '"/>');
        }
      });
    });
    parts.push('</g>');

    var orientFill = colorMode === 'light-on-dark' ? '#ffffff' : '#111111';
    parts.push('<path d="M ' + (x + size / 2).toFixed(3) + ' ' + (y + 0.5).toFixed(3) + ' l -1.2 1.6 h 2.4 z" fill="' + orientFill + '"/>');
    return parts.join('');
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

  function getSideLabel(side) {
    if (side === 'front') {
      return 'FRONT / лицевая сторона';
    }
    if (side === 'back') {
      return 'BACK / оборотная сторона';
    }
    return 'PRINT / односторонний лист';
  }

  function drawRegistrationMarksSvg(settings, pageOffsetY) {
    var positions = [
      [settings.marginMm / 2, pageOffsetY + settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, pageOffsetY + settings.marginMm / 2],
      [settings.marginMm / 2, pageOffsetY + settings.pageHeightMm - settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, pageOffsetY + settings.pageHeightMm - settings.marginMm / 2]
    ];
    return positions.map(function mark(position) {
      return [
        '<g class="registration-mark" stroke="#111111" stroke-width="0.3">',
        '<line x1="' + (position[0] - 2.5).toFixed(3) + '" y1="' + position[1].toFixed(3) + '" x2="' + (position[0] + 2.5).toFixed(3) + '" y2="' + position[1].toFixed(3) + '"/>',
        '<line x1="' + position[0].toFixed(3) + '" y1="' + (position[1] - 2.5).toFixed(3) + '" x2="' + position[0].toFixed(3) + '" y2="' + (position[1] + 2.5).toFixed(3) + '"/>',
        '</g>'
      ].join('');
    }).join('');
  }

  function drawCardSvg(node, payload, pageOffsetY, side) {
    var settings = payload.settings;
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var position = getNodePrintPosition(node, settings, side);
    var x = position.x;
    var y = position.y + pageOffsetY;
    var markerX = x + settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    var markerY = y + settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    if (settings.labelPlacement === 'side') {
      markerY = y + Math.max(settings.effectivePaddingMm, (settings.itemHeightMm - markerSize) / 2);
    }
    if (settings.labelPlacement === 'below') {
      markerX = x + Math.max(settings.effectivePaddingMm, (settings.itemWidthMm - markerSize) / 2);
    }
    var textX = settings.labelPlacement === 'side'
      ? x + settings.maxMarkerSizeMm + settings.effectivePaddingMm * 2 + 1.5
      : x + 0.8;
    var textY = settings.labelPlacement === 'side' ? y + 3.4 : y + markerSize + settings.effectivePaddingMm + 2.8;
    var parts = {
      markers: [],
      cutLines: [],
      safeArea: [],
      labels: []
    };
    var frontOnly = side === 'front' || side === 'single';
    var labelOnly = side === 'back';

    if (settings.showCutLines) {
      parts.cutLines.push('<rect class="cut-line" x="' + x.toFixed(3) + '" y="' + y.toFixed(3) + '" width="' + settings.itemWidthMm.toFixed(3) + '" height="' + settings.itemHeightMm.toFixed(3) + '" fill="none" stroke="#777777" stroke-width="0.15" stroke-dasharray="1.2 1.2"/>');
    }

    if (settings.showSafeArea) {
      parts.safeArea.push('<rect class="safe-area" x="' + (x + 1).toFixed(3) + '" y="' + (y + 1).toFixed(3) + '" width="' + (settings.itemWidthMm - 2).toFixed(3) + '" height="' + (settings.itemHeightMm - 2).toFixed(3) + '" fill="none" stroke="#7aa7d9" stroke-width="0.12" stroke-dasharray="0.8 0.8"/>');
    }

    if (frontOnly && settings.showStickerBounds) {
      parts.cutLines.push('<rect class="sticker-boundary" x="' + markerX.toFixed(3) + '" y="' + markerY.toFixed(3) + '" width="' + markerSize.toFixed(3) + '" height="' + markerSize.toFixed(3) + '" fill="none" stroke="#333333" stroke-width="0.18"/>');
    }

    if (frontOnly) {
      parts.markers.push(drawMarkerSvg(card.markerId, markerX, markerY, markerSize, settings.colorMode));
    }

    if ((frontOnly && settings.labelPlacement !== 'none' && settings.showBackingLabels) || labelOnly) {
      if (labelOnly) {
        parts.labels.push('<rect class="backing-label-boundary" x="' + x.toFixed(3) + '" y="' + y.toFixed(3) + '" width="' + settings.itemWidthMm.toFixed(3) + '" height="' + settings.itemHeightMm.toFixed(3) + '" fill="none" stroke="#d1d5db" stroke-width="0.15"/>');
        textY = y + 3;
        textX = x + 1;
      }
      parts.labels.push('<g font-family="Arial, sans-serif" fill="#111111">');
      if (settings.showCheckbox && labelOnly) {
        parts.labels.push('<rect x="' + (x + settings.itemWidthMm - 3.8).toFixed(3) + '" y="' + (y + 0.8).toFixed(3) + '" width="2.4" height="2.4" fill="none" stroke="#111111" stroke-width="0.2"/>');
      }
      if (settings.showId) {
        parts.labels.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.2">ID ' + escapeXml(card.displayId) + '</text>');
        textY += 2.7;
      }
      if (settings.showName) {
        parts.labels.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.35" font-weight="700">' + escapeXml(compactText(card.name, labelOnly ? 18 : 16)) + '</text>');
        textY += 2.8;
      }
      if (settings.showGroup && (labelOnly || settings.labelPlacement === 'side')) {
        parts.labels.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2">' + escapeXml(compactText(card.group, 18)) + '</text>');
        textY += 2.4;
      }
      if (settings.showArrow) {
        parts.labels.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2">↑ верх карты</text>');
      }
      parts.labels.push('</g>');
    }

    return parts;
  }

  function buildSvg(payload) {
    var settings = payload.settings;
    var pageGap = 8;
    var totalHeight = payload.pages.length * settings.pageHeightMm + Math.max(0, payload.pages.length - 1) * pageGap;
    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + settings.pageWidthMm + 'mm" height="' + totalHeight + 'mm" viewBox="0 0 ' + settings.pageWidthMm + ' ' + totalHeight + '" shape-rendering="crispEdges">',
      '<title>CardMark sticker sheets</title>'
    ];

    payload.pages.forEach(function drawPage(page, pageIndex) {
      var pageOffsetY = pageIndex * (settings.pageHeightMm + pageGap);
      parts.push('<g data-page="' + (pageIndex + 1) + '">');
      parts.push('<rect x="0" y="' + pageOffsetY + '" width="' + settings.pageWidthMm + '" height="' + settings.pageHeightMm + '" fill="#ffffff"/>');
      parts.push('<rect x="' + settings.marginMm + '" y="' + (pageOffsetY + settings.marginMm) + '" width="' + (settings.pageWidthMm - settings.marginMm * 2) + '" height="' + (settings.pageHeightMm - settings.marginMm * 2) + '" fill="none" stroke="#e5e7eb" stroke-width="0.2"/>');
      parts.push('<text class="page-side-label" x="5" y="' + (pageOffsetY + settings.pageHeightMm - 5).toFixed(3) + '" font-family="Arial, sans-serif" font-size="2.4" font-weight="700" fill="#6b7280">' + escapeXml(getSideLabel(page.side)) + '</text>');
      parts.push('<g id="layer-registration-marks-page-' + (pageIndex + 1) + '" class="layer-registration-marks">');
      if (settings.showRegistrationMarks || settings.layoutMode === 'plotter' || settings.duplexEnabled) {
        parts.push(drawRegistrationMarksSvg(settings, pageOffsetY));
      }
      parts.push('</g>');
      parts.push('<g id="layer-cut-lines-page-' + (pageIndex + 1) + '" class="layer-cut-lines">');

      page.nodes.forEach(function drawNode(node) {
        if (node.type === 'section') {
          parts.push('<text x="' + node.x.toFixed(3) + '" y="' + (node.y + pageOffsetY + 5).toFixed(3) + '" font-family="Arial, sans-serif" font-size="3.2" font-weight="700" fill="#111111">' + escapeXml(node.label) + '</text>');
        } else {
          parts.push(drawCardSvg(node, payload, pageOffsetY, page.side).cutLines.join(''));
        }
      });
      parts.push('</g>');
      parts.push('<g id="layer-safe-area-page-' + (pageIndex + 1) + '" class="layer-safe-area">');
      page.nodes.forEach(function drawNode(node) {
        if (node.type !== 'section') {
          parts.push(drawCardSvg(node, payload, pageOffsetY, page.side).safeArea.join(''));
        }
      });
      parts.push('</g>');
      parts.push('<g id="layer-markers-page-' + (pageIndex + 1) + '" class="layer-markers">');
      page.nodes.forEach(function drawNode(node) {
        if (node.type !== 'section') {
          parts.push(drawCardSvg(node, payload, pageOffsetY, page.side).markers.join(''));
        }
      });
      parts.push('</g>');
      parts.push('<g id="layer-backing-labels-page-' + (pageIndex + 1) + '" class="layer-backing-labels">');
      page.nodes.forEach(function drawNode(node) {
        if (node.type !== 'section') {
          parts.push(drawCardSvg(node, payload, pageOffsetY, page.side).labels.join(''));
        }
      });
      parts.push('</g>');
      parts.push('<g id="layer-page-labels-page-' + (pageIndex + 1) + '" class="layer-page-labels"></g>');
      parts.push('</g>');
    });

    parts.push('</svg>');
    return parts.join('');
  }

  function drawMarkerPdf(doc, markerId, x, y, size, colorMode) {
    var matrix = global.CardMark.buildMarkerMatrix(markerId);
    var palette = global.CardMark.getPalette(colorMode);
    var cell = size / global.CardMark.GRID_SIZE;

    if (palette.hasBackground) {
      var bg = palette.background === '#111111' ? 17 : 255;
      doc.setFillColor(bg, bg, bg);
      doc.rect(x, y, size, size, 'F');
    }

    var fg = palette.foreground === '#ffffff' ? 255 : 17;
    doc.setFillColor(fg, fg, fg);
    matrix.forEach(function drawRow(row, rowIndex) {
      row.forEach(function drawCell(value, colIndex) {
        if (value === 1) {
          doc.rect(x + colIndex * cell, y + rowIndex * cell, cell, cell, 'F');
        }
      });
    });

    doc.triangle(x + size / 2, y + 0.5, x + size / 2 - 1.2, y + 2.1, x + size / 2 + 1.2, y + 2.1, 'F');
  }

  function drawRegistrationMarksPdf(doc, settings) {
    var positions = [
      [settings.marginMm / 2, settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, settings.marginMm / 2],
      [settings.marginMm / 2, settings.pageHeightMm - settings.marginMm / 2],
      [settings.pageWidthMm - settings.marginMm / 2, settings.pageHeightMm - settings.marginMm / 2]
    ];
    doc.setDrawColor(17, 17, 17);
    doc.setLineWidth(0.3);
    positions.forEach(function mark(position) {
      doc.line(position[0] - 2.5, position[1], position[0] + 2.5, position[1]);
      doc.line(position[0], position[1] - 2.5, position[0], position[1] + 2.5);
    });
  }

  function drawCardPdf(doc, node, payload, side) {
    var settings = payload.settings;
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var position = getNodePrintPosition(node, settings, side);
    var x = position.x;
    var y = position.y;
    var markerX = x + settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    var markerY = y + settings.effectivePaddingMm + settings.effectiveCutBleedMm;
    if (settings.labelPlacement === 'side') {
      markerY = y + Math.max(settings.effectivePaddingMm, (settings.itemHeightMm - markerSize) / 2);
    }
    if (settings.labelPlacement === 'below') {
      markerX = x + Math.max(settings.effectivePaddingMm, (settings.itemWidthMm - markerSize) / 2);
    }
    var textX = settings.labelPlacement === 'side'
      ? x + settings.maxMarkerSizeMm + settings.effectivePaddingMm * 2 + 1.5
      : x + 0.8;
    var textY = settings.labelPlacement === 'side' ? y + 3.5 : y + markerSize + settings.effectivePaddingMm + 2.8;
    var frontOnly = side === 'front' || side === 'single';
    var labelOnly = side === 'back';

    doc.setDrawColor(188, 188, 188);
    doc.setLineWidth(0.15);
    if (settings.showCutLines) {
      doc.rect(x, y, settings.itemWidthMm, settings.itemHeightMm);
    }

    if (settings.showStickerBounds) {
      doc.setDrawColor(40, 40, 40);
      doc.rect(markerX, markerY, markerSize, markerSize);
    }

    if (settings.showSafeArea) {
      doc.setDrawColor(122, 167, 217);
      doc.rect(x + 1, y + 1, settings.itemWidthMm - 2, settings.itemHeightMm - 2);
    }

    if (frontOnly) {
      drawMarkerPdf(doc, card.markerId, markerX, markerY, markerSize, settings.colorMode);
    }

    if (settings.labelPlacement === 'none' && !labelOnly) {
      return;
    }

    doc.setTextColor(17, 17, 17);
    doc.setDrawColor(17, 17, 17);
    doc.setFont('helvetica', 'normal');
    if (labelOnly) {
      doc.setDrawColor(209, 213, 219);
      doc.rect(x, y, settings.itemWidthMm, settings.itemHeightMm);
      textX = x + 1;
      textY = y + 3;
      if (settings.showCheckbox) {
        doc.setDrawColor(17, 17, 17);
        doc.rect(x + settings.itemWidthMm - 3.8, y + 0.8, 2.4, 2.4);
      }
    }

    doc.setFontSize(6);
    if (settings.showId) {
      doc.text('ID ' + card.displayId, textX, textY);
      textY += 2.7;
    }
    if (settings.showName) {
      doc.setFont('helvetica', 'bold');
      doc.text(compactText(card.name, labelOnly ? 18 : 16), textX, textY);
      doc.setFont('helvetica', 'normal');
      textY += 2.8;
    }
    if (settings.showGroup && (labelOnly || settings.labelPlacement === 'side')) {
      doc.text(compactText(card.group, 18), textX, textY);
      textY += 2.4;
    }
    if (settings.showArrow) {
      doc.text('↑ верх карты', textX, textY);
    }
  }

  function downloadPdf(payload, notify) {
    var jsPdfApi = global.jspdf && global.jspdf.jsPDF;
    if (!jsPdfApi) {
      if (notify) {
        notify('PDF-библиотека недоступна. Используйте кнопку «Печать / PDF» и сохраните лист через браузер.');
      }
      global.print();
      return false;
    }

    var settings = payload.settings;
    var doc = new jsPdfApi({
      orientation: settings.orientation,
      unit: 'mm',
      format: settings.pdfFormat,
      compress: true
    });

    payload.pages.forEach(function drawPage(page, pageIndex) {
      if (pageIndex > 0) {
        doc.addPage(settings.pdfFormat, settings.orientation);
      }

      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, settings.pageWidthMm, settings.pageHeightMm, 'F');
      doc.setDrawColor(229, 231, 235);
      doc.setLineWidth(0.2);
      doc.rect(settings.marginMm, settings.marginMm, settings.pageWidthMm - settings.marginMm * 2, settings.pageHeightMm - settings.marginMm * 2);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(getSideLabel(page.side), 5, settings.pageHeightMm - 5);

      if (settings.showRegistrationMarks || settings.layoutMode === 'plotter' || settings.duplexEnabled) {
        drawRegistrationMarksPdf(doc, settings);
      }

      page.nodes.forEach(function drawNode(node) {
        if (node.type === 'section') {
          doc.setTextColor(17, 17, 17);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(node.label, node.x, node.y + 5);
        } else {
          drawCardPdf(doc, node, payload, page.side);
        }
      });
    });

    doc.save('cardmark-stickers.pdf');
    if (notify) {
      notify('PDF сформирован. Для идеальной кириллицы можно также использовать «Печать / PDF».');
    }
    return true;
  }

  function downloadManifest(manifest) {
    downloadBlob('cardmark-manifest.json', JSON.stringify(manifest, null, 2), 'application/json;charset=utf-8');
  }

  function downloadSvg(payload) {
    downloadBlob('cardmark-stickers.svg', buildSvg(payload), 'image/svg+xml;charset=utf-8');
  }

  global.CardMarkExporter = {
    downloadManifest: downloadManifest,
    downloadSvg: downloadSvg,
    downloadPdf: downloadPdf,
    printCurrent: function printCurrent() {
      global.print();
    },
    _buildSvg: buildSvg,
    _downloadBlob: downloadBlob
  };
})(window);
