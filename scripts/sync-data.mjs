/**
 * Fetches ambassador, species, and enclosure data from the official
 * alveusgg/data GitHub repository and writes enriched JSON to data/.
 *
 * Images are sourced directly from the alveusgg/data asset directory via
 * raw GitHub URLs, avoiding the Next.js image proxy entirely.
 *
 * Run with: node scripts/sync-data.mjs
 * Also executed by .github/workflows/sync-data.yml on a daily schedule.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DATA_DIR = join(ROOT, "data");

const RAW_SRC = "https://raw.githubusercontent.com/alveusgg/data/main/src";
const ASSETS_BASE = `${RAW_SRC}/assets/ambassadors`;
const API_TREE =
  "https://api.github.com/repos/alveusgg/data/git/trees/main?recursive=1";

async function fetchRaw(path) {
  const res = await fetch(`${RAW_SRC}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.text();
}

/**
 * Evaluates a TypeScript const object literal by extracting just the
 * object value (matching braces) and running it in a sandboxed vm context.
 */
function evalConst(src, name) {
  const declPattern = new RegExp(`\\bconst ${name}\\s*=\\s*\\{`);
  const match = declPattern.exec(src);
  if (!match) throw new Error(`const ${name} not found`);

  let depth = 0;
  let i = match.index + match[0].length - 1;
  const start = i;

  while (i < src.length) {
    const ch = src[i];
    if (ch === '"' || ch === "'" || ch === "`") {
      const quote = ch;
      i++;
      while (i < src.length) {
        if (src[i] === "\\") {
          i += 2;
          continue;
        }
        if (src[i] === quote) break;
        i++;
      }
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }

  const objectLiteral = src.slice(start, i + 1);

  let cleaned = "";
  let j = 0;
  while (j < objectLiteral.length) {
    const c = objectLiteral[j];
    if (c === '"' || c === "'" || c === "`") {
      cleaned += c;
      j++;
      while (j < objectLiteral.length) {
        const sc = objectLiteral[j];
        cleaned += sc;
        if (sc === "\\") {
          j++;
          cleaned += objectLiteral[j] ?? "";
        } else if (sc === c) break;
        j++;
      }
    } else if (c === "/" && objectLiteral[j + 1] === "/") {
      while (j < objectLiteral.length && objectLiteral[j] !== "\n") j++;
    } else {
      cleaned += c;
    }
    j++;
  }

  const ctx = {};
  try {
    vm.runInNewContext(`var result = ${cleaned}`, ctx);
  } catch (err) {
    throw new Error(`vm eval failed for ${name}: ${err.message}`);
  }
  return ctx.result;
}

/** Converts camelCase slug to kebab-case for Alveus website URLs. */
function toKebab(slug) {
  return slug.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`);
}

/**
 * Fetches the GitHub tree and returns a map of slug → sorted image filenames.
 * Only includes numbered images (01.jpg, 02.jpg, etc.), not badge/emote/icon.
 */
async function fetchImageMap() {
  const res = await fetch(API_TREE, {
    headers: { Accept: "application/vnd.github+json" },
  });
  if (!res.ok) throw new Error(`GitHub tree API failed: ${res.status}`);
  const { tree } = await res.json();

  const map = {};
  for (const item of tree) {
    const m = item.path.match(
      /^src\/assets\/ambassadors\/([^/]+)\/(\d{2}\.(jpg|png))$/,
    );
    if (!m) continue;
    const [, slug, filename] = m;
    (map[slug] ??= []).push(filename);
  }

  for (const slug of Object.keys(map)) {
    map[slug].sort();
  }

  return map;
}

async function main() {
  mkdirSync(DATA_DIR, { recursive: true });

  console.log("Fetching source files from alveusgg/data…");
  const [coreSrc, speciesSrc, enclosuresSrc] = await Promise.all([
    fetchRaw("ambassadors/core.ts"),
    fetchRaw("ambassadors/species.ts"),
    fetchRaw("enclosures.ts"),
  ]);

  console.log("Evaluating…");
  const ambassadors = evalConst(coreSrc, "ambassadors");
  const species = evalConst(speciesSrc, "species");
  const enclosures = evalConst(enclosuresSrc, "enclosures");

  console.log(
    `  ${Object.keys(ambassadors).length} ambassadors, ${Object.keys(species).length} species, ${Object.keys(enclosures).length} enclosures`,
  );

  console.log("Fetching image file tree from GitHub…");
  const imageMap = await fetchImageMap();
  console.log(`  Found images for ${Object.keys(imageMap).length} ambassadors`);

  /** Returns raw GitHub URLs for all numbered images of a slug. */
  function imagesForSlug(slug) {
    const files = imageMap[slug] ?? [];
    return files.map((f) => `${ASSETS_BASE}/${slug}/${f}`);
  }

  const active = Object.entries(ambassadors)
    .filter(([, a]) => a.retired === null)
    .map(([slug, a]) => {
      const sp = species[a.species] ?? null;
      const enc = enclosures[a.enclosure] ?? null;
      const imgs = imagesForSlug(slug);
      return {
        slug,
        slugKebab: toKebab(slug),
        name: a.name,
        alternate: a.alternate ?? [],
        commands: a.commands ?? [],
        sex: a.sex ?? null,
        birth: a.birth ?? null,
        arrival: a.arrival ?? null,
        enclosure: enc?.name ?? a.enclosure,
        story: a.story,
        mission: a.mission,
        fact: a.fact ?? null,
        clips: a.clips ?? [],
        homepage: a.homepage ?? null,
        plush: a.plush ?? null,
        images: imgs,
        photo: imgs[0] ?? null,
        species: sp
          ? {
              name: sp.name,
              scientificName: sp.scientificName,
              iucnStatus: sp.iucn.status,
              native: sp.native,
              class: sp.class,
              lifespan: sp.lifespan,
              birth: sp.birth,
            }
          : null,
      };
    });

  const retired = Object.entries(ambassadors)
    .filter(([, a]) => a.retired !== null)
    .map(([slug, a]) => {
      const sp = species[a.species] ?? null;
      const enc = enclosures[a.enclosure] ?? null;
      const imgs = imagesForSlug(slug);
      return {
        slug,
        slugKebab: toKebab(slug),
        name: a.name,
        retired: a.retired,
        enclosure: enc?.name ?? a.enclosure,
        mission: a.mission,
        images: imgs,
        photo: imgs[0] ?? null,
        species: sp
          ? {
              name: sp.name,
              scientificName: sp.scientificName,
              iucnStatus: sp.iucn.status,
              class: sp.class,
            }
          : null,
      };
    });

  const output = {
    generatedAt: new Date().toISOString(),
    source: "https://github.com/alveusgg/data",
    ambassadors: active,
    retired,
  };

  const outPath = join(DATA_DIR, "ambassadors.json");
  writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(
    `\n✓ ${active.length} active + ${retired.length} retired → data/ambassadors.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
