const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function walk(dir, cb) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((d) => {
    const full = path.join(dir, d.name);
    if (d.isDirectory()) walk(full, cb);
    else cb(full);
  });
}

function collapseSpacesOutsideQuotes(src) {
  let out = "";
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let prevChar = "";
  let spaceCount = 0;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === "'" && !inDouble && !inBacktick && prevChar !== "\\") {
      inSingle = !inSingle;
      out += ch;
      spaceCount = 0;
    } else if (ch === '"' && !inSingle && !inBacktick && prevChar !== "\\") {
      inDouble = !inDouble;
      out += ch;
      spaceCount = 0;
    } else if (ch === "`" && !inSingle && !inDouble && prevChar !== "\\") {
      inBacktick = !inBacktick;
      out += ch;
      spaceCount = 0;
    } else if (!inSingle && !inDouble && !inBacktick) {
      if (ch === " " || ch === "\t") {
        spaceCount++;
        if (spaceCount === 1) out += " ";
      } else {
        spaceCount = 0;
        out += ch;
      }
    } else {
      out += ch;
      spaceCount = 0;
    }
    prevChar = ch;
  }
  return out;
}

function cleanJS(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");

  src = src.replace(/^\s*\/\/.*$/gm, "");

  src = src.replace(
    /(^|\s)console\.[a-zA-Z_$][a-zA-Z0-9_$]*\s*\([\s\S]*?\)\s*;?/gim,
    "",
  );

  src = src.replace(/\bdebugger\s*;?/g, "");
  src = src.replace(/\b(alert|confirm|prompt)\s*\([\s\S]*?\)\s*;?/gim, "");

  src = src
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n");

  src = src.replace(/\n{3,}/g, "\n\n");

  try {
    src = collapseSpacesOutsideQuotes(src);
  } catch (e) {}

  return src.replace(/^\s+/, "");
}

function cleanCSS(src) {
  src = src.replace(/\/\*[\s\S]*?\*\//g, "");
  src = src
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n");
  src = src.replace(/\n{3,}/g, "\n\n");
  try {
    src = collapseSpacesOutsideQuotes(src);
  } catch (e) {}
  return src.replace(/^\s+/, "");
}

function cleanHTML(src) {
  if (!src) return src;

  const extracted = [];

  src = src.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (m, attrs, inner) => {
      if (/\bsrc\s*=\s*['"]/i.test(attrs)) return m; // skip external
      const code = inner.trim();
      if (!code) return "";
      const hash = crypto
        .createHash("sha1")
        .update(code)
        .digest("hex")
        .slice(0, 12);
      const fileName = `extracted-script-${hash}.js`;
      extracted.push({ type: "script", fileName, content: code });
      return `<script src="extracted/${fileName}"></script>`;
    },
  );

  src = src.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (m, attrs, inner) => {
      const css = inner.trim();
      if (!css) return "";
      const hash = crypto
        .createHash("sha1")
        .update(css)
        .digest("hex")
        .slice(0, 12);
      const fileName = `extracted-style-${hash}.css`;
      extracted.push({ type: "style", fileName, content: css });
      return `<link rel="stylesheet" href="extracted/${fileName}">`;
    },
  );

  src = src.replace(/<!--([\s\S]*?)-->/g, "");

  src = src.replace(/>\s+</g, "><");
  src = src.replace(/\s{2,}/g, " ");
  src = src.replace(/\n{3,}/g, "\n\n");

  src.__extracted = extracted;
  return src;
}

const root = path.resolve(__dirname, "..");
const exts = [".js", ".css", ".html"];
let modified = [];
let extractedFiles = [];
walk(root, (file) => {
  if (!exts.includes(path.extname(file))) return;

  if (file.includes("node_modules") || file.includes(".git")) return;
  const raw = fs.readFileSync(file, "utf8");
  let out = raw;
  try {
    if (file.endsWith(".js")) out = cleanJS(raw);
    else if (file.endsWith(".css")) out = cleanCSS(raw);
    else if (file.endsWith(".html")) {
      out = cleanHTML(raw);

      if (
        out &&
        out.__extracted &&
        Array.isArray(out.__extracted) &&
        out.__extracted.length
      ) {
        const dir = path.join(path.dirname(file), "extracted");
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        out.__extracted.forEach((item) => {
          const dest = path.join(dir, item.fileName);

          const content =
            item.type === "script"
              ? cleanJS(item.content)
              : cleanCSS(item.content);
          if (
            !fs.existsSync(dest) ||
            fs.readFileSync(dest, "utf8") !== content
          ) {
            fs.writeFileSync(dest, content, "utf8");
            extractedFiles.push(path.relative(root, dest));
          }
        });

        delete out.__extracted;
      }
    }
    if (out !== raw) {
      fs.writeFileSync(file, out, "utf8");
      modified.push(path.relative(root, file));
    }
  } catch (e) {}
});

process.stdout.write("Modified files: " + modified.length + "\n");
modified.forEach((f) => process.stdout.write(" - " + f + "\n"));
process.stdout.write("Extracted files: " + extractedFiles.length + "\n");
extractedFiles.forEach((f) => process.stdout.write(" - " + f + "\n"));
