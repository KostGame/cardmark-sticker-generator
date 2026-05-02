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

  function drawCardSvg(node, payload, pageOffsetY) {
    var settings = payload.settings;
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var x = node.x;
    var y = node.y + pageOffsetY;
    var markerY = y + Math.max(0, (settings.itemHeightMm - markerSize) / 2);
    var textX = x + settings.maxMarkerSizeMm + 2;
    var textY = y + 3.4;
    var parts = [];

    if (settings.showCutLines) {
      parts.push('<rect x="' + x.toFixed(3) + '" y="' + y.toFixed(3) + '" width="' + settings.itemWidthMm.toFixed(3) + '" height="' + settings.itemHeightMm.toFixed(3) + '" fill="none" stroke="#bbbbbb" stroke-width="0.15" stroke-dasharray="1.2 1.2"/>');
    }

    if (settings.showStickerBounds) {
      parts.push('<rect x="' + x.toFixed(3) + '" y="' + markerY.toFixed(3) + '" width="' + markerSize.toFixed(3) + '" height="' + markerSize.toFixed(3) + '" fill="none" stroke="#333333" stroke-width="0.18"/>');
    }

    parts.push(drawMarkerSvg(card.markerId, x, markerY, markerSize, settings.colorMode));

    if (settings.showCheckbox) {
      parts.push('<rect x="' + textX.toFixed(3) + '" y="' + (y + 0.7).toFixed(3) + '" width="3" height="3" fill="none" stroke="#111111" stroke-width="0.25"/>');
    }

    parts.push('<g font-family="Arial, sans-serif" fill="#111111">');
    if (settings.showId) {
      parts.push('<text x="' + (textX + (settings.showCheckbox ? 4 : 0)).toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.5">ID ' + escapeXml(card.displayId) + '</text>');
      textY += 3.2;
    }
    if (settings.showName) {
      parts.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.8" font-weight="700">' + escapeXml(compactText(card.name, 28)) + '</text>');
      textY += 3.4;
    }
    if (settings.showGroup) {
      parts.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.35">' + escapeXml(compactText(card.group, 30)) + '</text>');
      textY += 3;
    }
    if (settings.showArrow) {
      parts.push('<text x="' + textX.toFixed(3) + '" y="' + textY.toFixed(3) + '" font-size="2.35">↑ верх карты</text>');
    }
    parts.push('</g>');

    return parts.join('');
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

      page.nodes.forEach(function drawNode(node) {
        if (node.type === 'section') {
          parts.push('<text x="' + node.x.toFixed(3) + '" y="' + (node.y + pageOffsetY + 5).toFixed(3) + '" font-family="Arial, sans-serif" font-size="3.2" font-weight="700" fill="#111111">' + escapeXml(node.label) + '</text>');
        } else {
          parts.push(drawCardSvg(node, payload, pageOffsetY));
        }
      });
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

  function drawCardPdf(doc, node, payload) {
    var settings = payload.settings;
    var card = node.card;
    var markerSize = card.markerSizeMm || settings.markerSizeMm;
    var x = node.x;
    var y = node.y;
    var markerY = y + Math.max(0, (settings.itemHeightMm - markerSize) / 2);
    var textX = x + settings.maxMarkerSizeMm + 2;
    var textY = y + 3.5;

    doc.setDrawColor(188, 188, 188);
    doc.setLineWidth(0.15);
    if (settings.showCutLines) {
      doc.rect(x, y, settings.itemWidthMm, settings.itemHeightMm);
    }

    if (settings.showStickerBounds) {
      doc.setDrawColor(40, 40, 40);
      doc.rect(x, markerY, markerSize, markerSize);
    }

    drawMarkerPdf(doc, card.markerId, x, markerY, markerSize, settings.colorMode);

    doc.setTextColor(17, 17, 17);
    doc.setDrawColor(17, 17, 17);
    doc.setFont('helvetica', 'normal');
    if (settings.showCheckbox) {
      doc.rect(textX, y + 0.7, 3, 3);
    }

    doc.setFontSize(7);
    if (settings.showId) {
      doc.text('ID ' + card.displayId, textX + (settings.showCheckbox ? 4 : 0), textY);
      textY += 3.2;
    }
    if (settings.showName) {
      doc.setFont('helvetica', 'bold');
      doc.text(compactText(card.name, 28), textX, textY);
      doc.setFont('helvetica', 'normal');
      textY += 3.4;
    }
    if (settings.showGroup) {
      doc.text(compactText(card.group, 30), textX, textY);
      textY += 3;
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

      page.nodes.forEach(function drawNode(node) {
        if (node.type === 'section') {
          doc.setTextColor(17, 17, 17);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(node.label, node.x, node.y + 5);
        } else {
          drawCardPdf(doc, node, payload);
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
