import { useEffect, useState } from "react";

import {
  AMBASSADORS_CACHE_MS,
  type Ambassador,
  fetchAmbassadors,
} from "~/lib/alveus/ambassadors";
import { ambassadorsStorage, lastAmbassadorPollStorage } from "~/lib/storage";

const CLASS_LABELS: Record<string, string> = {
  mammalia: "Mammal",
  aves: "Bird",
  reptilia: "Reptile",
  amphibia: "Amphibian",
  insecta: "Insect",
  arachnida: "Arachnid",
  malacostraca: "Crustacean",
  diplopoda: "Millipede",
  plantae: "Plant",
};

const IUCN_META: Record<string, { label: string; color: string }> = {
  EX: { label: "Extinct", color: "bg-gray-600 text-white" },
  EW: { label: "Extinct in Wild", color: "bg-gray-600 text-white" },
  CR: { label: "Critical", color: "bg-red-700 text-white" },
  EN: { label: "Endangered", color: "bg-orange-600 text-white" },
  VU: { label: "Vulnerable", color: "bg-yellow-500 text-black" },
  NT: { label: "Near Threatened", color: "bg-lime-700 text-white" },
  LC: { label: "Least Concern", color: "bg-green-700 text-white" },
  DD: { label: "Data Deficient", color: "bg-gray-500 text-white" },
  NE: {
    label: "Not Evaluated",
    color: "bg-alveus-green-100 text-alveus-green-500",
  },
  NA: {
    label: "Not Applicable",
    color: "bg-alveus-green-100 text-alveus-green-500",
  },
};

function iucnMeta(status: string | null | undefined) {
  const base = (status ?? "NE").split("/")[0] ?? "NE";
  return IUCN_META[base] ?? IUCN_META["NE"]!;
}

/** Returns the primary image URL for an ambassador — prefers stored image array, falls back to GitHub assets. */
function resolvePhoto(a: Ambassador): string {
  return (
    a.images?.[0] ??
    `https://raw.githubusercontent.com/alveusgg/data/main/src/assets/ambassadors/${a.slug}/01.jpg`
  );
}

/** Calculates a human-readable age string from a partial date string. */
function calcAge(birth: string | null): string | null {
  if (!birth) return null;
  const year = parseInt(birth.split("-")[0] ?? "", 10);
  if (isNaN(year)) return null;
  const age = new Date().getFullYear() - year;
  return `~${age} year${age !== 1 ? "s" : ""} old`;
}

function classEmoji(cls: string | undefined): string {
  const map: Record<string, string> = {
    mammalia: "🦊",
    aves: "🦜",
    reptilia: "🐍",
    amphibia: "🐸",
    insecta: "🪲",
    arachnida: "🕷",
    malacostraca: "🦐",
    diplopoda: "🐛",
    plantae: "🌿",
  };
  return cls ? (map[cls] ?? "🐾") : "🐾";
}

function formatLifespan(v: unknown): string {
  if (v === "Unknown" || v === "Not Applicable" || v == null)
    return String(v ?? "Unknown");
  if (typeof v === "number") return `${v} yrs`;
  if (typeof v === "object" && v !== null && "min" in v && "max" in v) {
    return `${(v as { min: number; max: number }).min}–${(v as { min: number; max: number }).max} yrs`;
  }
  return String(v);
}

function formatDate(partial: string | null): string | null {
  if (!partial) return null;
  const parts = partial.split("-");
  const year = parts[0];
  const month = parts[1]
    ? new Date(`${partial}-01`).toLocaleDateString(undefined, { month: "long" })
    : null;
  return month ? `${month} ${year}` : (year ?? null);
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "mammalia", label: "Mammals" },
  { key: "aves", label: "Birds" },
  { key: "reptilia", label: "Reptiles" },
  { key: "amphibia", label: "Amphibians" },
  { key: "arachnida", label: "Arachnids" },
  { key: "insecta", label: "Insects" },
  { key: "malacostraca", label: "Crustaceans" },
  { key: "diplopoda", label: "Millipedes" },
  { key: "plantae", label: "Plants" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

export function AmbassadorsView() {
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Ambassador | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [rawCached, lastPoll] = await Promise.all([
          ambassadorsStorage.getValue(),
          lastAmbassadorPollStorage.getValue(),
        ]);
        const cached = rawCached ?? [];

        const cacheHasImages =
          cached.length > 0 && (cached[0]?.images?.length ?? 0) > 0;
        const cacheValid =
          cacheHasImages &&
          lastPoll !== null &&
          Date.now() - lastPoll < AMBASSADORS_CACHE_MS;

        if (cacheValid) {
          if (!cancelled) setAmbassadors(cached);
          return;
        }

        const fresh = await fetchAmbassadors();
        if (!cancelled) setAmbassadors(fresh);
        await Promise.all([
          ambassadorsStorage.setValue(fresh),
          lastAmbassadorPollStorage.setValue(Date.now()),
        ]);
      } catch {
        // network or storage failure — stay on loading screen rather than crash
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const visible =
    filter === "all"
      ? ambassadors
      : ambassadors.filter((a) => a.species?.class === filter);

  if (ambassadors.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-14 text-center">
        <div className="size-6 animate-spin rounded-full border-2 border-alveus-green-500 border-t-transparent" />
        <p className="text-xs text-alveus-green-600">Loading ambassadors…</p>
      </div>
    );
  }

  if (selected) {
    return (
      <DetailPanel ambassador={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <div className="@container flex flex-col">
      <div className="flex scrollbar-none gap-1.5 overflow-x-auto px-4 pt-3 pb-3">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={[
              "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors",
              filter === key
                ? "bg-alveus-green-700 text-white"
                : "bg-white/70 text-alveus-green-700 ring-1 ring-alveus-green-200 hover:bg-white hover:text-alveus-green-900",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <p className="px-4 pb-2 text-[10px] font-semibold tracking-widest text-alveus-green-600 uppercase">
        {visible.length} ambassador{visible.length !== 1 ? "s" : ""}
      </p>

      <div className="grid grid-cols-2 gap-2 px-4 pb-4 @[400px]:grid-cols-3 @[560px]:grid-cols-4">
        {visible.map((a) => (
          <button
            key={a.slug}
            onClick={() => setSelected(a)}
            className="group relative overflow-hidden rounded-2xl bg-white/70 ring-1 ring-alveus-green-200 transition-all hover:ring-alveus-green-400 active:scale-[0.97]"
          >
            <div className="aspect-square w-full overflow-hidden bg-alveus-green-100">
              <img
                src={resolvePhoto(a)}
                alt={a.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  const el = e.currentTarget;
                  el.style.display = "none";
                  el.nextElementSibling?.removeAttribute("hidden");
                }}
              />
              <div
                hidden
                className="flex h-full w-full items-center justify-center text-4xl"
              >
                {classEmoji(a.species?.class)}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/80 via-black/40 to-transparent px-2.5 pt-6 pb-2.5">
              <p className="text-left text-[13px] leading-tight font-bold text-white drop-shadow">
                {a.name}
              </p>
              <p className="text-left text-[10px] text-white/60">
                {a.species?.name ?? ""}
              </p>
            </div>

            {a.species?.iucnStatus &&
              (() => {
                const m = iucnMeta(a.species.iucnStatus);
                const base = a.species.iucnStatus.split("/")[0];
                if (base === "NE" || base === "NA") return null;
                return (
                  <span
                    className={`absolute top-2 right-2 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${m.color}`}
                  >
                    {base}
                  </span>
                );
              })()}
          </button>
        ))}
      </div>
    </div>
  );
}

function DetailPanel({
  ambassador: a,
  onBack,
}: {
  ambassador: Ambassador;
  onBack: () => void;
}) {
  const allImages: string[] = a.images ?? [];
  const [cursor, setCursor] = useState(0);
  const [deadImgs, setDeadImgs] = useState<Set<number>>(new Set());

  const images = allImages.filter((_, i) => !deadImgs.has(i));
  const activeImg = Math.min(cursor, Math.max(0, images.length - 1));
  const iucn = iucnMeta(a.species?.iucnStatus);
  const age = calcAge(a.birth);

  function handleImgError(url: string) {
    const idx = allImages.indexOf(url);
    if (idx === -1) return;
    setDeadImgs((prev) => new Set([...prev, idx]));
  }

  function prev() {
    setCursor((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function next() {
    setCursor((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  const birthLabel =
    a.species?.birth === "egg"
      ? "Hatched"
      : a.species?.birth === "seed"
        ? "Sprouted"
        : "Born";

  const plushLink = a.plush && "link" in a.plush ? a.plush.link : null;

  const iucnBase = (a.species?.iucnStatus ?? "NE").split("/")[0] ?? "NE";
  const iucnTrend = (a.species?.iucnStatus ?? "").split("/")[1];
  const iucnTrendLabel: Record<string, string> = {
    increasing: "↑ increasing",
    decreasing: "↓ decreasing",
    stable: "→ stable",
  };

  return (
    <div className="flex flex-col min-[780px]:absolute min-[780px]:inset-0 min-[780px]:flex-row">
      {/* Left column — sticky in narrow, fixed in wide */}
      <div className="sticky top-0 z-10 flex flex-col bg-alveus-green-900 min-[780px]:static min-[780px]:h-full min-[780px]:min-h-0 min-[780px]:w-[55%] min-[780px]:shrink-0 min-[780px]:overflow-hidden">
        {/* Hero */}
        <div className="relative h-56 w-full overflow-hidden bg-alveus-green-900 min-[400px]:h-64 min-[780px]:h-0 min-[780px]:min-h-0 min-[780px]:flex-1">
          {images.length > 0 ? (
            <img
              src={images[activeImg]}
              alt={`${a.name} photo ${activeImg + 1}`}
              className="h-full w-full object-cover"
              onError={() => handleImgError(images[activeImg]!)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-7xl">
              {classEmoji(a.species?.class)}
            </div>
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute top-1/2 left-2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Previous photo"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M9 2L4 7l5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={next}
                className="absolute top-1/2 right-2 z-20 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
                aria-label="Next photo"
              >
                <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5 2l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </>
          )}

          {/* Gradient + name overlay */}
          <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent" />

          <button
            onClick={onBack}
            className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </button>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-4 pb-4">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-2xl leading-tight font-bold text-white min-[780px]:text-3xl">
                  {a.name}
                </h2>
                {a.alternate.length > 0 && (
                  <p className="text-[11px] text-white/60 italic">
                    also: {a.alternate.join(", ")}
                  </p>
                )}
                {a.species && (
                  <p className="text-[13px] text-white/70">
                    {a.species.name}
                    {a.species.class && (
                      <span className="ml-1.5 text-white/40">
                        · {CLASS_LABELS[a.species.class] ?? a.species.class}
                      </span>
                    )}
                  </p>
                )}
              </div>
              {images.length > 1 && (
                <span className="shrink-0 pb-0.5 text-[10px] text-white/50">
                  {activeImg + 1} / {images.length}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {images.length > 1 && (
          <div className="flex shrink-0 scrollbar-none gap-1.5 overflow-x-auto bg-black/80 px-3 py-2 min-[780px]:flex-wrap min-[780px]:overflow-x-hidden">
            {images.map((url, i) => (
              <button
                key={url}
                onClick={() => setCursor(i)}
                className={`size-12 shrink-0 overflow-hidden rounded-lg ring-2 transition-all min-[780px]:size-14 ${activeImg === i ? "ring-white" : "opacity-50 ring-transparent hover:opacity-80"}`}
              >
                <img
                  src={url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right column — scrollable in wide mode */}
      <div className="flex flex-col gap-4 px-4 pt-4 pb-6 *:shrink-0 min-[780px]:min-h-0 min-[780px]:flex-1 min-[780px]:overflow-y-auto min-[780px]:overscroll-contain">
        {/* Story + mission */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[12px] leading-relaxed text-alveus-green-500">
            {a.story}
          </p>
          <p className="text-[12px] leading-relaxed font-medium text-alveus-green-800">
            {a.mission}
          </p>
        </div>

        {/* Stats table */}
        <div className="overflow-hidden rounded-2xl bg-white/70 ring-1 ring-alveus-green-200">
          {a.species && (
            <>
              <StatRow
                label="Species"
                value={
                  <span>
                    {a.species.name}{" "}
                    <em className="text-alveus-green-400 not-italic">
                      {a.species.scientificName}
                    </em>
                  </span>
                }
              />
              <StatRow
                label="Conservation"
                value={
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${iucn.color}`}
                    >
                      {iucnBase} — {iucn.label}
                    </span>
                    {iucnTrend && iucnTrendLabel[iucnTrend] && (
                      <span className="text-[10px] text-alveus-green-400">
                        {iucnTrendLabel[iucnTrend]}
                      </span>
                    )}
                  </span>
                }
              />
              {a.species.native && (
                <StatRow label="Native To" value={a.species.native} />
              )}
              {(a.species.lifespan?.wild != null ||
                a.species.lifespan?.captivity != null) && (
                <StatRow
                  label="Lifespan"
                  value={
                    <span className="flex flex-wrap gap-3">
                      {a.species.lifespan.wild != null && (
                        <span>
                          <span className="text-alveus-green-400">Wild </span>
                          {formatLifespan(a.species.lifespan.wild)}
                        </span>
                      )}
                      {a.species.lifespan.captivity != null && (
                        <span>
                          <span className="text-alveus-green-400">
                            Captivity{" "}
                          </span>
                          {formatLifespan(a.species.lifespan.captivity)}
                        </span>
                      )}
                    </span>
                  }
                />
              )}
            </>
          )}
          {a.birth && (
            <StatRow
              label={birthLabel}
              value={
                <span className="flex flex-col">
                  <span>{formatDate(a.birth) ?? a.birth}</span>
                  {age && (
                    <span className="text-[10px] text-alveus-green-400">
                      {age}
                    </span>
                  )}
                </span>
              }
            />
          )}
          {a.sex && <StatRow label="Sex" value={a.sex} />}
          {a.arrival && (
            <StatRow
              label="Arrived"
              value={formatDate(a.arrival) ?? a.arrival}
            />
          )}
          <StatRow label="Enclosure" value={a.enclosure} last />
        </div>

        {/* Fun fact */}
        {a.fact && (
          <div className="rounded-2xl bg-white/70 px-3.5 py-3 ring-1 ring-alveus-green-200">
            <p className="mb-2 text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
              Did you know?
            </p>
            {a.fact.split("\n\n").map((para, i) => (
              <p
                key={i}
                className={`text-[12px] leading-relaxed text-alveus-green-700 ${i > 0 ? "mt-2" : ""}`}
              >
                {para}
              </p>
            ))}
          </div>
        )}

        {/* Clips */}
        {a.clips.length > 0 && (
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
              Clips
            </p>
            <div className="flex flex-col gap-1.5">
              {a.clips.map((clip) => (
                <a
                  key={clip.id}
                  href={`https://www.youtube.com/watch?v=${clip.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2.5 ring-1 ring-alveus-green-200 transition-all hover:bg-white hover:ring-alveus-green-300"
                >
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-600/90">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 10 10"
                      fill="white"
                    >
                      <path d="M3 2l6 3-6 3V2z" />
                    </svg>
                  </div>
                  <span className="text-[12px] text-alveus-green-700">
                    {clip.caption}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* CTA row: plush + website */}
        <div className="flex flex-col gap-2">
          {plushLink && (
            <a
              href={plushLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-alveus-green-100 py-2.5 text-[13px] font-semibold text-alveus-green-800 ring-1 ring-alveus-green-300 transition-colors hover:bg-alveus-green-200"
            >
              🧸 Get {a.name} Plush
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M3 1.5h6v6M9 1.5L1.5 9"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              </svg>
            </a>
          )}
          <a
            href={`https://www.alveussanctuary.org/ambassadors/${a.slugKebab}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-alveus-green-700 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-alveus-green-600"
          >
            View on alveussanctuary.org
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M4 2h7v7M11 2L2 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  last,
}: {
  label: string;
  value: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 px-3.5 py-2.5 ${!last ? "border-b border-alveus-green-100" : ""}`}
    >
      <span className="w-24 shrink-0 pt-0.5 text-[11px] font-semibold text-alveus-green-400">
        {label}
      </span>
      <span className="text-[12px] text-alveus-green-800">{value}</span>
    </div>
  );
}
