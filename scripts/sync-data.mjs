/**
 * Fetches ambassador, species, and enclosure data from the official
 * alveusgg/data GitHub repository and writes clean JSON to data/.
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

const RAW_BASE = "https://raw.githubusercontent.com/alveusgg/data/main/src";

async function fetchRaw(path) {
  const res = await fetch(`${RAW_BASE}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.text();
}

/**
 * Evaluates a TypeScript const object literal by extracting just the
 * object value (matching braces) and running it in a sandboxed vm context.
 *
 * @param {string} src - Full TypeScript source file text
 * @param {string} name - Name of the const to extract
 */
function evalConst(src, name) {
  // Find `const <name> = {` and locate the opening brace
  const declPattern = new RegExp(`\\bconst ${name}\\s*=\\s*\\{`);
  const match = declPattern.exec(src);
  if (!match) throw new Error(`const ${name} not found`);

  // Walk forward to find the matching closing brace
  let depth = 0;
  let i = match.index + match[0].length - 1; // position of opening `{`
  const start = i;

  while (i < src.length) {
    const ch = src[i];
    // Skip string contents so braces inside strings don't count
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

  // Strip single-line comments that appear outside of string literals.
  // We walk char-by-char to skip comment content inside strings.
  let cleaned = "";
  let j = 0;
  while (j < objectLiteral.length) {
    const c = objectLiteral[j];
    if (c === '"' || c === "'" || c === "`") {
      // Copy the entire string literal verbatim
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
      // Skip to end of line
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
    throw new Error(
      `vm eval failed for ${name}: ${err.message}\nSnippet start: ${cleaned.slice(0, 200)}`,
    );
  }
  return ctx.result;
}

/** Resolves a Next.js static media path to a full CDN URL via the image optimizer. */
function imageUrl(path, width = 400) {
  return `https://www.alveussanctuary.org/_next/image?url=${encodeURIComponent(path)}&w=${width}&q=75`;
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

  // Discover the current Next.js build ID so we can hit the data routes
  console.log("Discovering Next.js build ID…");
  const pageRes = await fetch(
    "https://www.alveussanctuary.org/ambassadors/georgie",
  );
  const pageHtml = await pageRes.text();
  const buildIdMatch = pageHtml.match(/"buildId":"([^"]+)"/);
  const buildId = buildIdMatch?.[1] ?? null;
  console.log(`  buildId: ${buildId ?? "(not found)"}`);

  // Fetch the first real photo for each ambassador from the Next.js data route
  const photos = {};
  if (buildId) {
    const slugs = Object.keys(ambassadors);
    console.log(`Fetching photos for ${slugs.length} ambassadors…`);

    const results = await Promise.allSettled(
      slugs.map(async (slug) => {
        const url = `https://www.alveussanctuary.org/_next/data/${buildId}/ambassadors/${slug}.json`;
        const r = await fetch(url);
        if (!r.ok) return;
        const j = await r.json();
        const firstImg = j?.pageProps?.images?.[0]?.src?.src;
        const icon = j?.pageProps?.iconImage?.src?.src;
        const src = firstImg ?? icon ?? null;
        if (src) photos[slug] = imageUrl(src, 400);
      }),
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const fail = results.filter((r) => r.status === "rejected").length;
    console.log(`  ${ok} ok, ${fail} failed`);
  }

  // Build the combined ambassador records
  const active = Object.entries(ambassadors)
    .filter(([, a]) => a.retired === null)
    .map(([slug, a]) => {
      const sp = species[a.species] ?? null;
      const enc = enclosures[a.enclosure] ?? null;
      return {
        slug,
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
        photo: photos[slug] ?? null,
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
      return {
        slug,
        name: a.name,
        retired: a.retired,
        enclosure: enc?.name ?? a.enclosure,
        mission: a.mission,
        photo: photos[slug] ?? null,
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
    `\n✓ ${active.length} active + ${retired.length} retired ambassadors → data/ambassadors.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
