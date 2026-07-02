import { useEffect, useRef } from "react";

import { channelsStorage } from "~/lib/storage";
import { ALVEUS_CHANNELS, type AlveusChannel } from "~/lib/twitch/constants";
import type { TwitchChannel } from "~/lib/twitch/types";

import { ChannelCard } from "./ChannelCard";
import { useStorage } from "./hooks/useStorage";

const DEFAULT_CHANNELS: Record<AlveusChannel, TwitchChannel | null> = {
  alveussanctuary: null,
  maya: null,
};

export function LiveView() {
  const [channels] = useStorage<Record<AlveusChannel, TwitchChannel | null>>(
    channelsStorage,
    DEFAULT_CHANNELS,
  );

  const polled = useRef(false);
  useEffect(() => {
    if (polled.current) return;
    polled.current = true;
    void chrome.runtime.sendMessage({ type: "poll:now" });
  }, []);

  const liveChannels = ALVEUS_CHANNELS.filter(
    (l) => channels[l]?.stream != null,
  );
  const offlineChannels = ALVEUS_CHANNELS.filter(
    (l) => channels[l] != null && channels[l]?.stream == null,
  );
  const allNull = ALVEUS_CHANNELS.every((l) => channels[l] === null);

  return (
    <div className="flex flex-col gap-2.5 p-4">
      {allNull && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <div className="size-8 animate-spin rounded-full border-2 border-alveus-green-600 border-t-transparent" />
          <p className="text-sm text-alveus-green-600">Checking live status…</p>
        </div>
      )}

      {liveChannels.length > 0 && (
        <p className="px-0.5 text-[10px] font-semibold tracking-widest text-alveus-green-700 uppercase">
          Live Now
        </p>
      )}

      {liveChannels.map((login) => {
        const channel = channels[login];
        if (!channel) return null;
        return <ChannelCard key={login} channel={channel} isLive />;
      })}

      {liveChannels.length > 0 && offlineChannels.length > 0 && (
        <div className="my-1 border-t border-alveus-green-200" />
      )}

      {!allNull && liveChannels.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-alveus-green-100">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle
                cx="11"
                cy="11"
                r="4"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-alveus-green-600"
              />
              <path
                d="M6 16A7 7 0 0 1 16 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-alveus-green-400"
              />
              <path
                d="M16 16A7 7 0 0 1 6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-alveus-green-400"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-alveus-green-900">
              All channels offline
            </p>
            <p className="mt-0.5 text-xs text-alveus-green-600">
              We'll notify you when Alveus goes live
            </p>
          </div>
        </div>
      )}

      {offlineChannels.length > 0 && (
        <p className="px-0.5 text-[10px] font-semibold tracking-widest text-alveus-green-700 uppercase">
          Offline
        </p>
      )}

      {offlineChannels.map((login) => {
        const channel = channels[login];
        if (!channel) return null;
        return <ChannelCard key={login} channel={channel} isLive={false} />;
      })}
    </div>
  );
}
