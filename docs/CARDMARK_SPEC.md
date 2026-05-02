# CardMark v0 Specification

CardMark v0 is the prototype marker format currently implemented in `src/cardmark.js`. This document describes the existing implementation and does not introduce a new format.

CardMark v0 is provisional and may change before a stable v1. Camera recognition is not implemented in the current project.

## 1. Назначение CardMark

CardMark is a small machine-readable marker intended to be printed as a sticker and placed on a playing card, Tarot card or card protector. Its goal is to let a future browser application identify a card from a camera image without AI, OCR, external APIs or server processing.

## 2. Почему это не QR-код

CardMark is intentionally smaller and simpler than QR. It stores only a compact numeric `markerId`, not arbitrary text or URLs. This keeps the sticker minimal and leaves card metadata in the JSON manifest.

## 3. Что хранит метка

The marker stores:

- `markerId` in the range `0..127`;
- checksum bits for basic validation;
- inverted ID bits for redundancy;
- version bits for the prototype v0 payload.

The marker does not store the card name, group, suit, deck type or human-readable label.

## 4. Что хранит JSON-манифест

The JSON manifest stores the semantic card mapping:

- format and version;
- deck type and deck label;
- marker size in millimeters;
- card records with `id`, `group`, `name` and `markerId`.

The future recognition app should read `markerId` from the image and use the JSON manifest to map it to a card.

## 5. Текущий формат CardMark v0

- Marker type: square SVG marker.
- Logical grid: 7×7 cells.
- Render modes: dark on light, light on dark, economy.
- Logical matrix is independent from render colors.
- Public generator: `CardMark.generateCardMark(id, options)`.
- Determinism requirement: the same `id` must always produce the same logical matrix.

## 6. Структура 7×7

Coordinates are zero-based: `(row, col)`.

### Outer frame

All cells in row `0`, row `6`, column `0` and column `6` are logical dark cells (`1`). The frame is reserved for future marker detection.

### Orientation anchors

The inner corner anchors are:

| Cell | Value | Meaning |
| --- | --- | --- |
| `(1,1)` | `1` | Orientation anchor |
| `(1,5)` | `1` | Orientation anchor |
| `(5,1)` | `1` | Orientation anchor |
| `(5,5)` | `0` | Different corner for unambiguous orientation |

The different bottom-right anchor makes the marker asymmetric, so future recognition can determine the top edge and reversed card position.

### Payload cells

The remaining 21 inner cells are filled row-major after skipping orientation anchor cells:

| Order | Cell |
| --- | --- |
| 1 | `(1,2)` |
| 2 | `(1,3)` |
| 3 | `(1,4)` |
| 4 | `(2,1)` |
| 5 | `(2,2)` |
| 6 | `(2,3)` |
| 7 | `(2,4)` |
| 8 | `(2,5)` |
| 9 | `(3,1)` |
| 10 | `(3,2)` |
| 11 | `(3,3)` |
| 12 | `(3,4)` |
| 13 | `(3,5)` |
| 14 | `(4,1)` |
| 15 | `(4,2)` |
| 16 | `(4,3)` |
| 17 | `(4,4)` |
| 18 | `(4,5)` |
| 19 | `(5,2)` |
| 20 | `(5,3)` |
| 21 | `(5,4)` |

Payload layout:

1. 7 ID bits, most significant bit first.
2. 4 CRC bits.
3. 7 inverted ID bits.
4. 3 version bits.

For v0, version bits are `000`.

## 7. Диапазон markerId

`markerId` must be an integer from `0` to `127`. Values outside this range are invalid for CardMark v0.

## 8. CRC/parity/checksum

The current implementation uses a 4-bit CRC-like checksum over the 7 ID bits:

- initial value: binary `1010`;
- for each ID bit, shift left and append the bit;
- if the previous top bit was `1`, XOR with binary `0011`;
- keep only the lower 4 bits.

This checksum is simple prototype validation, not a cryptographic or strong error-correction code.

## 9. Инвертированные ID-биты

After the checksum, the marker stores the 7 ID bits inverted bit-by-bit. These bits give the future recognizer a cheap redundancy check and help make patterns less symmetric.

## 10. Требования к физической наклейке

- The sticker should contain only the CardMark marker and a small top cue.
- Default marker size is 8 mm.
- Quick sizes are 6 mm, 8 mm, 10 mm and 12 mm.
- The marker should remain square and high-contrast.
- For Tarot decks, stickers should preferably be placed on protectors, not directly on cards.

## 11. Требования к подложке

Human-readable information belongs on the backing sheet, next to the sticker:

- card name;
- ID;
- group or suit;
- top arrow;
- applied checkbox;
- optional cut lines and sticker bounds.

This keeps the actual sticker minimal after it is removed from the sheet.

## 12. Требования к ориентации

The marker must be asymmetric. The current v0 asymmetry comes from:

- three dark inner corner anchors;
- one light inner corner anchor;
- a small top cue rendered on the sticker.

Future recognition should use the orientation anchors to determine the marker's top edge. The top cue is primarily for humans during application.

## 13. Требования для будущего распознавания

A future recognizer should be able to:

- find the outer frame;
- normalize perspective enough to sample a 7×7 grid;
- identify orientation from the anchor cells;
- read the 21 payload cells;
- validate ID, checksum and inverted ID bits;
- determine upright or reversed card position;
- map `markerId` through the JSON manifest.

## 14. Открытые вопросы

- Is 7×7 enough for real camera recognition under poor lighting?
- Should v1 use stronger error correction?
- Should v1 reserve more version or deck bits?
- What minimum printed size is reliable across common printers and phone cameras?
- Should the top cue remain part of the sticker in v1 or be moved entirely to the backing sheet?
