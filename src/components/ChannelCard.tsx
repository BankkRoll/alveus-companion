import type { TwitchChannel } from "~/lib/twitch/types";

interface ChannelCardProps {
  channel: TwitchChannel;
  isLive: boolean;
}

function formatUptime(createdAt: string): string {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60_000,
  );
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatViewers(count: number): string {
  return count >= 1000 ? `${(count / 1000).toFixed(1)}K` : String(count);
}

export function ChannelCard({ channel, isLive }: ChannelCardProps) {
  return (
    <a
      href={`https://twitch.tv/${channel.login}`}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl bg-white/70 ring-1 ring-alveus-green-200 transition-all hover:bg-white hover:ring-alveus-green-300"
    >
      {isLive && channel.stream?.previewImageURL && (
        <div className="relative aspect-video w-full overflow-hidden">
          <img
            src={`${channel.stream.previewImageURL.replace("{width}", "400").replace("{height}", "225")}?t=${Math.floor(Date.now() / 60_000)}`}
            alt={`${channel.displayName} stream preview`}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase">
              <span className="inline-block size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
            {channel.stream.viewersCount != null && (
              <span className="rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white/90">
                {formatViewers(channel.stream.viewersCount)} viewers
              </span>
            )}
          </div>

          {channel.stream.createdAt && (
            <span className="absolute right-2.5 bottom-2.5 rounded-md bg-black/70 px-2 py-0.5 text-[11px] text-white/70">
              {formatUptime(channel.stream.createdAt)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 px-3.5 py-3">
        <div className="relative shrink-0">
          <img
            src={channel.profileImageURL}
            alt={channel.displayName}
            width={38}
            height={38}
            className="rounded-full ring-2 ring-alveus-green-200"
          />
          {isLive && (
            <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white bg-red-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold text-alveus-green-900">
              {channel.displayName}
            </span>
            {!isLive && (
              <span className="shrink-0 rounded-md bg-alveus-green-100 px-1.5 py-0.5 text-[10px] font-medium text-alveus-green-600">
                Offline
              </span>
            )}
          </div>

          {isLive && channel.stream ? (
            <>
              <p className="mt-0.5 line-clamp-1 text-[12px] text-alveus-green-700">
                {channel.stream.title}
              </p>
              {channel.stream.game && (
                <p className="mt-0.5 text-[11px] text-alveus-green-500">
                  {channel.stream.game.name}
                </p>
              )}
            </>
          ) : (
            channel.lastBroadcast?.title && (
              <p className="mt-0.5 line-clamp-1 text-[12px] text-alveus-green-400">
                {channel.lastBroadcast.title}
              </p>
            )
          )}
        </div>

        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="shrink-0 text-alveus-green-300 transition-colors group-hover:text-alveus-green-500"
        >
          <path
            d="M5 2.5l4.5 4.5L5 11.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </a>
  );
}
