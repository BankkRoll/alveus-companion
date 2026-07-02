import { useEffect, useState } from "react";

import { channelPrefsStorage } from "~/lib/storage";

import { useStorage } from "./hooks/useStorage";

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={[
        "relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
        checked
          ? "border-alveus-green-500 bg-alveus-green-600"
          : "border-alveus-green-200 bg-alveus-green-100",
      ].join(" ")}
    >
      <span
        className={[
          "pointer-events-none ml-0.5 inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        ].join(" ")}
      />
      <span className="sr-only">{checked ? "Disable" : "Enable"}</span>
    </button>
  );
}

function Row({
  label,
  sub,
  checked,
  onChange,
  disabled,
  indent,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-3.5 py-2.5 ${indent ? "pl-7" : ""}`}
    >
      <div className="min-w-0">
        <p
          className={`text-[12px] leading-snug font-medium ${disabled ? "text-alveus-green-300" : "text-alveus-green-900"}`}
        >
          {label}
        </p>
        <p
          className={`mt-0.5 text-[10px] leading-snug ${disabled ? "text-alveus-green-300" : "text-alveus-green-600"}`}
        >
          {sub}
        </p>
      </div>
      <Toggle
        checked={checked}
        onChange={() => onChange(!checked)}
        disabled={disabled}
      />
    </div>
  );
}

function Divider() {
  return <div className="mx-3.5 border-t border-alveus-green-100" />;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white/70 ring-1 ring-alveus-green-200">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
      {children}
    </p>
  );
}

function PermissionBanner({ onGranted }: { onGranted: () => void }) {
  const [state, setState] = useState<NotificationPermission | "unknown">(
    "unknown",
  );

  useEffect(() => {
    if ("Notification" in window) setState(Notification.permission);
  }, []);

  if (state === "granted" || state === "unknown") return null;

  async function request() {
    const result = await Notification.requestPermission();
    setState(result);
    if (result === "granted") onGranted();
  }

  return (
    <div className="bg-amber-50 ring-amber-300 rounded-2xl px-3.5 py-3 ring-1">
      <div className="flex items-start gap-2.5">
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          className="text-amber-500 mt-0.5 shrink-0"
        >
          <path
            d="M7.5 2L13 12H2L7.5 2z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M7.5 6.5v3M7.5 11v.5"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>
        <div className="flex-1">
          <p className="text-amber-800 text-[12px] font-semibold">
            {state === "denied"
              ? "Notifications blocked"
              : "Notifications not enabled"}
          </p>
          <p className="text-amber-700 mt-0.5 text-[11px] leading-snug">
            {state === "denied"
              ? "Unblock in your browser site settings to receive desktop alerts."
              : "Grant permission to get desktop alerts when Alveus goes live."}
          </p>
          {state === "default" && (
            <button
              onClick={request}
              className="bg-amber-100 text-amber-800 ring-amber-300 hover:bg-amber-200 mt-2 rounded-lg px-3 py-1.5 text-[11px] font-semibold ring-1 transition-colors"
            >
              Allow notifications
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChannelBlock({
  name,
  url,
  enabled,
  onEnabled,
  rows,
  notifEnabled,
}: {
  name: string;
  url: string;
  enabled: boolean;
  onEnabled: (v: boolean) => void;
  rows: {
    label: string;
    sub: string;
    checked: boolean;
    onChange: (v: boolean) => void;
  }[];
  notifEnabled: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4 px-3.5 py-3">
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-alveus-green-900">{name}</p>
          <p className="text-[10px] text-alveus-green-500">{url}</p>
        </div>
        <Toggle checked={enabled} onChange={() => onEnabled(!enabled)} />
      </div>

      {rows.map((r) => (
        <div key={r.label}>
          <Divider />
          <Row
            label={r.label}
            sub={r.sub}
            checked={r.checked}
            onChange={r.onChange}
            disabled={!enabled || !notifEnabled}
            indent
          />
        </div>
      ))}
    </Card>
  );
}

const DEFAULT_PREFS = {
  alveussanctuary: { enabled: true, streamLive: true, streamTitle: true },
  maya: { enabled: true, streamLive: true, streamTitle: true },
  alveus: { enabled: true, video: true, announcements: true },
};

export function SettingsView() {
  const [prefs, setPrefs] = useStorage(channelPrefsStorage, DEFAULT_PREFS);
  const [notifGranted, setNotifGranted] = useState(false);

  useEffect(() => {
    if ("Notification" in window)
      setNotifGranted(Notification.permission === "granted");
  }, []);

  function patchSanctuary(patch: Partial<typeof prefs.alveussanctuary>) {
    setPrefs({
      ...prefs,
      alveussanctuary: { ...prefs.alveussanctuary, ...patch },
    });
  }
  function patchMaya(patch: Partial<typeof prefs.maya>) {
    setPrefs({ ...prefs, maya: { ...prefs.maya, ...patch } });
  }
  function patchAlveus(patch: Partial<typeof prefs.alveus>) {
    setPrefs({ ...prefs, alveus: { ...prefs.alveus, ...patch } });
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-4">
      <PermissionBanner onGranted={() => setNotifGranted(true)} />

      <section>
        <SectionLabel>AlveusSanctuary</SectionLabel>
        <ChannelBlock
          name="AlveusSanctuary"
          url="twitch.tv/alveussanctuary"
          enabled={prefs.alveussanctuary.enabled}
          onEnabled={(v) => patchSanctuary({ enabled: v })}
          notifEnabled={notifGranted}
          rows={[
            {
              label: "Stream goes live",
              sub: "Desktop alert when AlveusSanctuary starts streaming",
              checked: prefs.alveussanctuary.streamLive,
              onChange: (v) => patchSanctuary({ streamLive: v }),
            },
            {
              label: "Title changes",
              sub: "Desktop alert when the stream title updates mid-broadcast",
              checked: prefs.alveussanctuary.streamTitle,
              onChange: (v) => patchSanctuary({ streamTitle: v }),
            },
          ]}
        />
      </section>

      <section>
        <SectionLabel>Maya</SectionLabel>
        <ChannelBlock
          name="Maya"
          url="twitch.tv/maya"
          enabled={prefs.maya.enabled}
          onEnabled={(v) => patchMaya({ enabled: v })}
          notifEnabled={notifGranted}
          rows={[
            {
              label: "Stream goes live",
              sub: "Desktop alert when Maya starts streaming",
              checked: prefs.maya.streamLive,
              onChange: (v) => patchMaya({ streamLive: v }),
            },
            {
              label: "Title changes",
              sub: "Desktop alert when the stream title updates mid-broadcast",
              checked: prefs.maya.streamTitle,
              onChange: (v) => patchMaya({ streamTitle: v }),
            },
          ]}
        />
      </section>

      <section>
        <SectionLabel>Alveus Updates</SectionLabel>
        <ChannelBlock
          name="Alveus Sanctuary"
          url="alveussanctuary.org"
          enabled={prefs.alveus.enabled}
          onEnabled={(v) => patchAlveus({ enabled: v })}
          notifEnabled={notifGranted}
          rows={[
            {
              label: "New YouTube videos",
              sub: "Desktop alert when Alveus posts a new video",
              checked: prefs.alveus.video,
              onChange: (v) => patchAlveus({ video: v }),
            },
            {
              label: "Announcements",
              sub: "Desktop alert for sanctuary news, fundraisers, and events",
              checked: prefs.alveus.announcements,
              onChange: (v) => patchAlveus({ announcements: v }),
            },
          ]}
        />
      </section>

      <section>
        <SectionLabel>About</SectionLabel>
        <Card>
          <div className="px-3.5 py-3.5">
            <p className="text-[12px] leading-relaxed text-alveus-green-700">
              Alveus Companion is an open-source fan project. Not affiliated
              with or endorsed by Alveus Sanctuary.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <a
                href="https://alveussanctuary.org"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-alveus-green-100 px-3 py-1.5 text-[11px] font-medium text-alveus-green-800 ring-1 ring-alveus-green-200 transition-colors hover:bg-alveus-green-200"
              >
                alveussanctuary.org
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M2 1h5v5M7 1L1 7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a
                href="https://github.com/BankkRoll/alveus-companion"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-alveus-green-100 px-3 py-1.5 text-[11px] font-medium text-alveus-green-800 ring-1 ring-alveus-green-200 transition-colors hover:bg-alveus-green-200"
              >
                GitHub
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                  <path
                    d="M2 1h5v5M7 1L1 7"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
