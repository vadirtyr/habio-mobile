import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const source = await readFile(new URL("../lib/theme/contrast.js", import.meta.url), "utf8");
const tempModule = join(tmpdir(), "ourorbit-theme-contrast-test.mjs");
await writeFile(tempModule, source);

const {
  gradientContrastInfo,
  readableTextForColor,
  relativeLuminance,
} = await import(`file://${tempModule}`);

assert.equal(readableTextForColor("#FFFFFF"), "#111827");
assert.equal(readableTextForColor("#020617"), "#FFFFFF");
assert(relativeLuminance("#FFFFFF") > relativeLuminance("#000000"));

const lightGradient = gradientContrastInfo(["#F8FAFC", "#EAF4FF", "#22C7DE"]);
assert.equal(lightGradient.textColor, "#111827");

const darkGradient = gradientContrastInfo(["#050816", "#0F172A", "#1E1B4B"]);
assert.equal(darkGradient.textColor, "#FFFFFF");

console.log("theme contrast tests passed");
