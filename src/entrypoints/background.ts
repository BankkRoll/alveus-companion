import { defineBackground } from "wxt/utils/define-background";

import {
  AMBASSADORS_CACHE_MS,
  fetchAmbassadors,
} from "~/lib/alveus/ambassadors";
import { fetchCalendarEvents, fetchNotifications } from "~/lib/alveus/api";
import {
  notifyAlveusUpdate,
  notifyStreamLive,
  notifyTitleChange,
} from "~/lib/notifications";
import {
  alveusNotificationsStorage,
  ambassadorsStorage,
  calendarEventsStorage,
  channelPrefsStorage,
  channelsStorage,
  enabledStorage,
  lastAlveusPollStorage,
  lastAmbassadorPollStorage,
  seenNotificationIdsStorage,
} from "~/lib/storage";
import { ALVEUS_CHANNELS, type AlveusChannel } from "~/lib/twitch/constants";
import { fetchAlveusChannels } from "~/lib/twitch/gql";

const TWITCH_POLL_MINUTES = 1;
const ALVEUS_POLL_MS = 30 * 60 * 1000;

export default defineBackground(() => {
  chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create("poll:twitch", {
      delayInMinutes: 0,
      periodInMinutes: TWITCH_POLL_MINUTES,
    });
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  });

  chrome.runtime.onStartup.addListener(() => {
    void pollTwitch();
    void maybePollAlveus();
  });

  chrome.alarms.onAlarm.addListener(async (alarm: chrome.alarms.Alarm) => {
    if (alarm.name === "poll:twitch") {
      await pollTwitch();
      await maybePollAlveus();
      await maybePollAmbassadors();
    }
  });

  chrome.runtime.onMessage.addListener(
    (message: { type: string }, _sender, sendResponse) => {
      if (message.type === "poll:now") {
        void pollTwitch()
          .then(() => maybePollAlveus())
          .then(() => maybePollAmbassadors());
        sendResponse({ ok: true });
      }
      return false;
    },
  );
});

async function pollTwitch(): Promise<void> {
  if (!(await enabledStorage.getValue())) return;

  const prefs = await channelPrefsStorage.getValue();
  const previous = await channelsStorage.getValue();

  let current: Awaited<ReturnType<typeof fetchAlveusChannels>>;
  try {
    current = await fetchAlveusChannels();
  } catch {
    return;
  }

  for (const login of ALVEUS_CHANNELS) {
    const channelPrefs = prefs[login];
    if (!channelPrefs.enabled) continue;

    const prev = previous[login];
    const next = current[login];
    if (!next) continue;

    const wasLive = prev?.stream != null;
    const isLive = next.stream != null;

    if (!wasLive && isLive && channelPrefs.streamLive) {
      notifyStreamLive(login, next);
    }

    if (
      wasLive &&
      isLive &&
      channelPrefs.streamTitle &&
      prev?.stream?.title !== next.stream?.title
    ) {
      notifyTitleChange(login, next);
    }
  }

  await channelsStorage.setValue(current);
  updateBadge(current, prefs.alveussanctuary.enabled, prefs.maya.enabled);
}

async function maybePollAlveus(): Promise<void> {
  if (!(await enabledStorage.getValue())) return;

  const lastPoll = await lastAlveusPollStorage.getValue();
  if (lastPoll !== null && Date.now() - lastPoll < ALVEUS_POLL_MS) return;

  const prefs = await channelPrefsStorage.getValue();
  const seenIds = await seenNotificationIdsStorage.getValue();

  try {
    const [{ items }, events] = await Promise.all([
      fetchNotifications(["video", "announcements"]),
      fetchCalendarEvents(),
    ]);

    const seen = new Set(seenIds);
    const newSeen: string[] = [];

    for (const item of items) {
      if (seen.has(item.id)) continue;

      const shouldNotify =
        prefs.alveus.enabled &&
        ((item.tag === "video" && prefs.alveus.video) ||
          (item.tag === "announcements" && prefs.alveus.announcements));

      if (shouldNotify) {
        notifyAlveusUpdate(item.id, item.title, item.message, item.imageUrl);
      }

      newSeen.push(item.id);
    }

    if (newSeen.length > 0) {
      await seenNotificationIdsStorage.setValue(
        [...seenIds, ...newSeen].slice(-200),
      );
    }

    await alveusNotificationsStorage.setValue(items);
    await calendarEventsStorage.setValue(events);
    await lastAlveusPollStorage.setValue(Date.now());
  } catch {
    // Silently fail — will retry on next alarm tick
  }
}

async function maybePollAmbassadors(): Promise<void> {
  const lastPoll = await lastAmbassadorPollStorage.getValue();
  if (lastPoll !== null && Date.now() - lastPoll < AMBASSADORS_CACHE_MS) return;

  try {
    await ambassadorsStorage.setValue(await fetchAmbassadors());
    await lastAmbassadorPollStorage.setValue(Date.now());
  } catch {
    // Silently fail — cached data remains available
  }
}

/**
 * Updates the extension action badge. Shows "LIVE" in green when any enabled
 * channel is streaming, clears the badge when all are offline.
 */
function updateBadge(
  channels: Awaited<ReturnType<typeof fetchAlveusChannels>>,
  sanctuaryEnabled: boolean,
  mayaEnabled: boolean,
): void {
  const enabledMap: Record<AlveusChannel, boolean> = {
    alveussanctuary: sanctuaryEnabled,
    maya: mayaEnabled,
  };

  const anyLive = ALVEUS_CHANNELS.some(
    (login) => enabledMap[login] && channels[login]?.stream != null,
  );

  if (anyLive) {
    chrome.action.setBadgeText({ text: "LIVE" });
    chrome.action.setBadgeBackgroundColor({ color: "#dc2626" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}
