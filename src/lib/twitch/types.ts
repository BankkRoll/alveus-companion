import { z } from "zod";

export const twitchGameSchema = z.object({
  id: z.string(),
  name: z.string(),
  boxArtURL: z.string(),
});

export const twitchStreamSchema = z.object({
  id: z.string(),
  title: z.string(),
  viewersCount: z.number(),
  createdAt: z.string(),
  type: z.string(),
  game: twitchGameSchema.nullable(),
  previewImageURL: z.string(),
});

export const twitchLastBroadcastSchema = z.object({
  title: z.string(),
  startedAt: z.string().nullable(),
  game: z.object({ name: z.string() }).nullable(),
});

export const twitchChannelSchema = z.object({
  id: z.string(),
  login: z.string(),
  displayName: z.string(),
  description: z.string().nullable(),
  profileImageURL: z.string(),
  primaryColorHex: z.string().nullable(),
  followers: z.object({ totalCount: z.number() }),
  roles: z.object({ isAffiliate: z.boolean(), isPartner: z.boolean() }),
  stream: twitchStreamSchema.nullable(),
  lastBroadcast: twitchLastBroadcastSchema.nullable(),
});

export type TwitchGame = z.infer<typeof twitchGameSchema>;
export type TwitchStream = z.infer<typeof twitchStreamSchema>;
export type TwitchChannel = z.infer<typeof twitchChannelSchema>;
