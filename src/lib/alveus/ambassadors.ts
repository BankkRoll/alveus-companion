import { z } from "zod";

/** Raw GitHub URL for the generated ambassador JSON in this repo. */
export const AMBASSADORS_JSON_URL =
  "https://raw.githubusercontent.com/BankkRoll/alveus-companion/main/data/ambassadors.json";

/** Cache duration for fetched ambassador data. */
export const AMBASSADORS_CACHE_MS = 24 * 60 * 60 * 1000;

const lifespanSchema = z.union([
  z.number(),
  z.object({ min: z.number(), max: z.number() }),
  z.literal("Not Applicable"),
  z.literal("Unknown"),
]);

export const ambassadorSpeciesSchema = z.object({
  name: z.string(),
  scientificName: z.string(),
  iucnStatus: z.string(),
  native: z.string(),
  class: z.string(),
  lifespan: z.object({
    wild: lifespanSchema.optional(),
    captivity: lifespanSchema.optional(),
  }),
  birth: z.string().optional(),
});

export const ambassadorSchema = z.object({
  slug: z.string(),
  name: z.string(),
  alternate: z.array(z.string()),
  commands: z.array(z.string()),
  sex: z.string().nullable(),
  birth: z.string().nullable(),
  arrival: z.string().nullable(),
  enclosure: z.string(),
  story: z.string(),
  mission: z.string(),
  fact: z.string().nullable(),
  clips: z.array(z.object({ id: z.string(), caption: z.string() })),
  homepage: z.object({ title: z.string(), description: z.string() }).nullable(),
  plush: z
    .union([z.object({ link: z.string() }), z.object({ soon: z.string() })])
    .nullable(),
  photo: z.string().nullable(),
  species: ambassadorSpeciesSchema.nullable(),
});

const ambassadorsResponseSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  ambassadors: z.array(ambassadorSchema),
  retired: z.array(ambassadorSchema.partial()).optional(),
});

export type Ambassador = z.infer<typeof ambassadorSchema>;

/**
 * Fetches the latest ambassador data from the raw GitHub JSON and returns active ambassadors.
 */
export async function fetchAmbassadors(): Promise<Ambassador[]> {
  const response = await fetch(AMBASSADORS_JSON_URL);
  if (!response.ok)
    throw new Error(`Ambassador fetch failed: ${response.status}`);
  return ambassadorsResponseSchema.parse(await response.json()).ambassadors;
}
