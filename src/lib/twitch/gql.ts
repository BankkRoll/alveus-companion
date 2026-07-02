import { z } from "zod";

import {
  ALVEUS_CHANNELS,
  type AlveusChannel,
  TWITCH_CLIENT_ID,
  TWITCH_GQL_URL,
} from "./constants";
import { type TwitchChannel, twitchChannelSchema } from "./types";

const CHANNEL_QUERY = `
  query ChannelStatus($login: String!) {
    user(login: $login) {
      id
      login
      displayName
      description
      profileImageURL(width: 300)
      primaryColorHex
      followers { totalCount }
      roles { isAffiliate isPartner }
      stream {
        id
        title
        viewersCount
        createdAt
        type
        game { id name boxArtURL(width: 40, height: 56) }
        previewImageURL(width: 440, height: 248)
      }
      lastBroadcast {
        title
        startedAt
        game { name }
      }
    }
  }
`;

const batchResponseSchema = z.array(
  z.object({ data: z.object({ user: twitchChannelSchema.nullable() }) }),
);

/**
 * Fetches live status for all monitored channels in a single batched GQL request.
 *
 * @returns Map of channel login → channel data, or `null` if the channel was not found.
 */
export async function fetchAlveusChannels(): Promise<
  Record<AlveusChannel, TwitchChannel | null>
> {
  const body = ALVEUS_CHANNELS.map((login) => ({
    query: CHANNEL_QUERY,
    variables: { login },
  }));

  const response = await fetch(TWITCH_GQL_URL, {
    method: "POST",
    headers: {
      "Client-ID": TWITCH_CLIENT_ID,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Twitch GQL request failed: ${response.status}`);
  }

  const results = batchResponseSchema.parse(await response.json());

  return Object.fromEntries(
    ALVEUS_CHANNELS.map((login, i) => [login, results[i]?.data.user ?? null]),
  ) as Record<AlveusChannel, TwitchChannel | null>;
}
