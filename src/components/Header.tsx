import { enabledStorage } from "~/lib/storage";

import { useStorage } from "./hooks/useStorage";

export function Header() {
  const [enabled, setEnabled] = useStorage(enabledStorage, true);

  return (
    <header className="flex items-center justify-between border-b border-white/8 bg-alveus-green-900 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <img
          src="/icon/32.png"
          alt=""
          width={22}
          height={22}
          className="rounded-md"
        />
        <div>
          <p className="text-[13px] font-bold tracking-wide text-alveus-tan-100">
            Alveus Companion
          </p>
          <p className="text-[10px] leading-none text-alveus-green-400">
            Sanctuary Tracker
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => void setEnabled(!enabled)}
        className="flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-white/5"
      >
        <span
          className={`text-[10px] font-semibold tracking-wide transition-colors ${
            enabled ? "text-alveus-green-400" : "text-white/30"
          }`}
        >
          {enabled ? "Enabled" : "Disabled"}
        </span>
        <span
          className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border border-white/10 transition-colors duration-200 ${
            enabled ? "bg-alveus-green-600" : "bg-white/10"
          }`}
        >
          <span
            className={`pointer-events-none ml-0.5 inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              enabled ? "translate-x-4" : "translate-x-0"
            }`}
          />
        </span>
        <span className="sr-only">
          {enabled ? "Disable" : "Enable"} extension
        </span>
      </button>
    </header>
  );
}
