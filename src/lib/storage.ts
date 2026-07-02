import { storage } from "@wxt-dev/storage";

import type { Ambassador } from "./alveus/ambassadors";
import type { AlveusNotification, CalendarEvent } from "./alveus/types";
import type { AlveusChannel } from "./twitch/constants";
import type { TwitchChannel } from "./twitch/types";

/** Extension enabled/disabled toggle. When false, the background worker skips all polling. */
export const enabledStorage = storage.defineItem<boolean>("local:enabled", {
  defaultValue: true,
});

/**
 * Per-channel notification preferences.
 * Twitch channels each have enabled + per-type toggles.
 * The `alveus` key covers platform-level notifications (videos, announcements).
 */
export const channelPrefsStorage = storage.defineItem<{
  alveussanctuary: {
    enabled: boolean;
    streamLive: boolean;
    streamTitle: boolean;
  };
  maya: { enabled: boolean; streamLive: boolean; streamTitle: boolean };
  alveus: { enabled: boolean; video: boolean; announcements: boolean };
}>("local:channelPrefs", {
  defaultValue: {
    alveussanctuary: { enabled: true, streamLive: true, streamTitle: true },
    maya: { enabled: true, streamLive: true, streamTitle: true },
    alveus: { enabled: true, video: true, announcements: true },
  },
});

/** Cached Twitch channel state, updated every poll interval. */
export const channelsStorage = storage.defineItem<
  Record<AlveusChannel, TwitchChannel | null>
>("local:channels", {
  defaultValue: { alveussanctuary: null, maya: null },
});

/** IDs of notifications already shown, used to prevent duplicates across service worker restarts. */
export const seenNotificationIdsStorage = storage.defineItem<string[]>(
  "local:seenNotificationIds",
  { defaultValue: [] },
);

/** Cached Alveus calendar events, refreshed every 30 minutes. */
export const calendarEventsStorage = storage.defineItem<CalendarEvent[]>(
  "local:calendarEvents",
  { defaultValue: [] },
);

/** Cached Alveus video and announcement notifications, refreshed every 30 minutes. */
export const alveusNotificationsStorage = storage.defineItem<
  AlveusNotification[]
>("local:alveusNotifications", { defaultValue: [] });

/** Unix timestamp of the last successful Alveus tRPC poll. */
export const lastAlveusPollStorage = storage.defineItem<number | null>(
  "local:lastAlveusPoll",
  { defaultValue: null },
);

/** Cached ambassador data fetched from the generated GitHub JSON, refreshed daily. */
export const ambassadorsStorage = storage.defineItem<Ambassador[]>(
  "local:ambassadors",
  { defaultValue: [] },
);

/** Unix timestamp of the last successful ambassador data fetch. */
export const lastAmbassadorPollStorage = storage.defineItem<number | null>(
  "local:lastAmbassadorPoll",
  { defaultValue: null },
);
