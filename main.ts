// news-image-20261122 entry (Node 22, standard library only).
//
// The entry is one image summing up the world's news of Sunday 22 November
// 2026: Iran strikes Bahrain and tankers are hit at Hormuz, Mexico captures
// the FBI most-wanted drug boss El Chapo Isidro, the EU and Indonesia sign
// a trade deal after a decade of talks, COP31 talks in Antalya go into
// overtime, and a Russian ship is hit in the Gulf of Finland.
//
// This program only hands that image to the gate: it reads entry.png from
// the bot directory, checks it is a PNG of at most 1 MiB and 1024 by 1024
// pixels, and writes the exact same bytes into the output directory.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR
// stand in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1024;

function fail(message: string): never {
  console.error(`news-image-20261122: ${message}`);
  process.exit(1);
}

const source = join(BOT_DIR, 'entry.png');
let bytes: Buffer;
try {
  bytes = readFileSync(source);
} catch (err) {
  fail(`cannot read ${source}: ${(err as Error).message}`);
}

if (bytes.length === 0 || bytes.length > MAX_BYTES) {
  fail(`entry.png must be 1 byte to 1 MiB, got ${bytes.length} bytes`);
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
if (bytes.length < 33 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
  fail('entry.png is not a PNG file');
}
if (bytes.toString('ascii', 12, 16) !== 'IHDR') {
  fail('entry.png has no IHDR chunk');
}
const width = bytes.readUInt32BE(16);
const height = bytes.readUInt32BE(20);
if (width === 0 || height === 0 || width > MAX_DIMENSION || height > MAX_DIMENSION) {
  fail(`entry.png must be at most 1024 by 1024 pixels, got ${width} by ${height}`);
}

// A whole image: the file must end with the IEND chunk (4 zero length bytes,
// the ASCII letters IEND, and its 4-byte CRC) and nothing after it.
const IEND_TAIL = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44]);
if (bytes.length < 45 || !bytes.subarray(bytes.length - 12, bytes.length - 4).equals(IEND_TAIL)) {
  fail('entry.png is truncated or has trailing data: no IEND chunk at the end');
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const target = join(OUTPUT_DIR, 'entry.png');
writeFileSync(target, bytes);
console.log(`news-image-20261122: entry handed over: ${width}x${height}, ${bytes.length} bytes`);
