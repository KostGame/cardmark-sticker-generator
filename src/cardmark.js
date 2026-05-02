(function attachCardMark(global) {
  'use strict';

  /**
   * CardMark v0 machine-readable marker format.
   *
   * Logical grid:
   * - 7x7 square cells, rendered as SVG with crisp vector rectangles.
   * - Outer ring cells are always dark logical bits and act as the future
   *   detector frame.
   * - Inner corner anchor cells at (1,1), (1,5), (5,1), (5,5) encode
   *   orientation. Three are dark; bottom-right is light. That asymmetry
   *   makes the top edge and reversed card position discoverable later.
   * - The remaining 21 inner cells are filled row-major with:
   *   7 ID bits (MSB first), 4 CRC bits, 7 inverted ID bits, 3 version bits.
   * - Version bits are 000 for CardMark v0. The supported marker ID range is
   *   0..127, so the future recognizer can be small and deterministic.
   *
   * Rendering colors do not change the logical matrix. The same marker ID
   * always produces the same 7x7 bit matrix.
   */

  var GRID_SIZE = 7;
  var VERSION = '0.1';
  var FORMAT_NAME = 'CardMark';
  var ANCHOR_CELLS = {
    '1,1': 1,
    '1,5': 1,
    '5,1': 1,
    '5,5': 0
  };

  function clampMarkerSize(sizeMm) {
    var size = Number(sizeMm);
    if (!Number.isFinite(size) || size <= 0) {
      return 8;
    }
    return Math.max(4, Math.min(24, size));
  }

  function validateMarkerId(id) {
    var markerId = Number(id);
    if (!Number.isInteger(markerId) || markerId < 0 || markerId > 127) {
      throw new RangeError('CardMark v0 supports marker IDs from 0 to 127.');
    }
    return markerId;
  }

  function toSevenBits(id) {
    var markerId = validateMarkerId(id);
    var bits = [];
    for (var shift = 6; shift >= 0; shift -= 1) {
      bits.push((markerId >> shift) & 1);
    }
    return bits;
  }

  function crc4(bits) {
    var crc = 0b1010;
    for (var index = 0; index < bits.length; index += 1) {
      var top = (crc >> 3) & 1;
      crc = ((crc << 1) & 0b1111) | bits[index];
      if (top === 1) {
        crc ^= 0b0011;
      }
    }
    return crc & 0b1111;
  }

  function buildPayloadBits(id) {
    var idBits = toSevenBits(id);
    var checksum = crc4(idBits);
    var checksumBits = [];
    for (var shift = 3; shift >= 0; shift -= 1) {
      checksumBits.push((checksum >> shift) & 1);
    }

    var invertedBits = idBits.map(function invert(bit) {
      return bit === 1 ? 0 : 1;
    });

    return idBits.concat(checksumBits, invertedBits, [0, 0, 0]);
  }

  function isOuterFrame(row, col) {
    return row === 0 || col === 0 || row === GRID_SIZE - 1 || col === GRID_SIZE - 1;
  }

  function isAnchorCell(row, col) {
    return Object.prototype.hasOwnProperty.call(ANCHOR_CELLS, row + ',' + col);
  }

  function buildMarkerMatrix(id) {
    var payload = buildPayloadBits(id);
    var payloadIndex = 0;
    var matrix = [];

    for (var row = 0; row < GRID_SIZE; row += 1) {
      var cells = [];
      for (var col = 0; col < GRID_SIZE; col += 1) {
        if (isOuterFrame(row, col)) {
          cells.push(1);
        } else if (isAnchorCell(row, col)) {
          cells.push(ANCHOR_CELLS[row + ',' + col]);
        } else {
          cells.push(payload[payloadIndex]);
          payloadIndex += 1;
        }
      }
      matrix.push(cells);
    }

    if (payloadIndex !== 21) {
      throw new Error('CardMark v0 payload mapping must consume exactly 21 cells.');
    }

    return matrix;
  }

  function getPalette(colorMode) {
    if (colorMode === 'light-on-dark') {
      return {
        foreground: '#ffffff',
        background: '#111111',
        hasBackground: true
      };
    }

    if (colorMode === 'economy') {
      return {
        foreground: '#111111',
        background: 'none',
        hasBackground: false
      };
    }

    return {
      foreground: '#111111',
      background: '#ffffff',
      hasBackground: true
    };
  }

  function escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function generateCardMark(id, options) {
    var markerId = validateMarkerId(id);
    var markerOptions = options || {};
    var sizeMm = clampMarkerSize(markerOptions.sizeMm);
    var palette = getPalette(markerOptions.colorMode);
    var matrix = buildMarkerMatrix(markerId);
    var title = markerOptions.title || 'CardMark ' + markerId;
    var cells = [];

    if (palette.hasBackground) {
      cells.push('<rect width="7" height="7" fill="' + palette.background + '"/>');
    }

    cells.push('<g fill="' + palette.foreground + '">');
    for (var row = 0; row < GRID_SIZE; row += 1) {
      for (var col = 0; col < GRID_SIZE; col += 1) {
        if (matrix[row][col] === 1) {
          cells.push('<rect x="' + col + '" y="' + row + '" width="1" height="1"/>');
        }
      }
    }
    cells.push('</g>');

    return [
      '<svg class="cardmark-svg" xmlns="http://www.w3.org/2000/svg"',
      ' width="' + sizeMm + 'mm" height="' + sizeMm + 'mm" viewBox="0 0 7 7"',
      ' role="img" aria-label="' + escapeAttribute(title) + '"',
      ' data-cardmark-id="' + markerId + '" shape-rendering="crispEdges">',
      '<title>' + escapeAttribute(title) + '</title>',
      cells.join(''),
      '</svg>'
    ].join('');
  }

  global.CardMark = {
    FORMAT_NAME: FORMAT_NAME,
    VERSION: VERSION,
    GRID_SIZE: GRID_SIZE,
    generateCardMark: generateCardMark,
    buildMarkerMatrix: buildMarkerMatrix,
    buildPayloadBits: buildPayloadBits,
    clampMarkerSize: clampMarkerSize,
    getPalette: getPalette,
    validateMarkerId: validateMarkerId,
    crc4: crc4
  };
})(window);
