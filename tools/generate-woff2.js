#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const ttf2woff2 = require("ttf2woff2");

const src = process.argv[2];
const outDir = process.argv[3] || "assets";

if (!src) {
  process.exit(1);
}

if (!fs.existsSync(src)) {
  process.exit(1);
}

const buffer = fs.readFileSync(src);
let woff2;
try {
  woff2 = ttf2woff2(buffer);
} catch (e) {
  process.exit(2);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(
  outDir,
  path.basename(src, path.extname(src)) + ".woff2",
);
fs.writeFileSync(outPath, Buffer.from(woff2));
