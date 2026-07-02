/** Unauthenticated Twitch client ID embedded in Twitch's own frontend. */
export const TWITCH_CLIENT_ID = "kimne78kx3ncx6brgo4mv6wki5h1ko";

export const TWITCH_GQL_URL = "https://gql.twitch.tv/gql";

/** Twitch channels monitored by the extension. */
export const ALVEUS_CHANNELS = ["alveussanctuary", "maya"] as const;

export type AlveusChannel = (typeof ALVEUS_CHANNELS)[number];
