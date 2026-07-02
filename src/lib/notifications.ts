import type { AlveusChannel } from "./twitch/constants";
import type { TwitchChannel } from "./twitch/types";

const ICON_URL = "/icon/128.png";

/**
 * Fires a Chrome notification when a channel transitions from offline to live.
 *
 * @param channel - Channel login name
 * @param data - Current channel data from Twitch GQL
 */
export function notifyStreamLive(
  channel: AlveusChannel,
  data: TwitchChannel,
): void {
  chrome.notifications.create(`stream-live-${channel}`, {
    type: "basic",
    iconUrl: ICON_URL,
    title: `${data.displayName} is live`,
    message: data.stream?.title ?? "",
    contextMessage: data.stream?.game?.name ?? "",
    priority: 2,
  });
}

/**
 * Fires a Chrome notification when a live stream's title changes.
 *
 * @param channel - Channel login name
 * @param data - Current channel data containing the updated title
 */
export function notifyTitleChange(
  channel: AlveusChannel,
  data: TwitchChannel,
): void {
  chrome.notifications.create(`stream-title-${channel}-${Date.now()}`, {
    type: "basic",
    iconUrl: ICON_URL,
    title: `${data.displayName} updated the stream`,
    message: data.stream?.title ?? "",
    priority: 1,
  });
}

/**
 * Fires a Chrome notification for a new Alveus video or announcement.
 *
 * @param id - Unique notification ID from the Alveus API
 * @param title - Notification title
 * @param message - Notification body text
 * @param imageUrl - Optional thumbnail URL
 */
export function notifyAlveusUpdate(
  id: string,
  title: string,
  message: string,
  imageUrl: string | null,
): void {
  chrome.notifications.create(`alveus-${id}`, {
    type: imageUrl ? "image" : "basic",
    iconUrl: ICON_URL,
    imageUrl: imageUrl ?? undefined,
    title,
    message,
    priority: 1,
  });
}
