import type { Tab } from "~/entrypoints/sidepanel/App";

interface NavItem {
  id: Tab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "live",
    label: "Live",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="13" r="2" fill="currentColor" />
        <path
          d="M6.5 10.5a5 5 0 0 1 7 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={active ? "1" : "0.6"}
        />
        <path
          d="M4 8a8 8 0 0 1 12 0"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={active ? "0.7" : "0.35"}
        />
      </svg>
    ),
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect
          x="3"
          y="4"
          width="14"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.5"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? "0.15" : "0"}
        />
        <path d="M3 8h14" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M7 2v3M13 2v3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7 11h2M7 14h6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={active ? "1" : "0.6"}
        />
      </svg>
    ),
  },
  {
    id: "ambassadors",
    label: "Animals",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M10 3C6.686 3 4 5.686 4 9c0 2.09.987 3.95 2.518 5.142C7.3 14.72 8 15.5 8 16.5h4c0-1 .7-1.78 1.482-2.358C15.013 12.95 16 11.09 16 9c0-3.314-2.686-6-6-6z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? "0.15" : "0"}
        />
        <path
          d="M8 17h4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M9 3V2M11 3V2"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (active) => (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle
          cx="10"
          cy="10"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill={active ? "currentColor" : "none"}
          fillOpacity={active ? "0.3" : "0"}
        />
        <path
          d="M10 2.5v1.25M10 16.25V17.5M17.5 10h-1.25M3.75 10H2.5M15.303 4.697l-.884.884M5.581 14.42l-.884.883M15.303 15.303l-.884-.884M5.581 5.58l-.884-.884"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function NavBar({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="border-t border-white/8 bg-alveus-green-900">
      <ul className="flex" role="tablist">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const isActive = active === id;
          return (
            <li key={id} className="flex-1" role="none">
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(id)}
                className={`flex w-full flex-col items-center gap-1 py-3 text-[10px] font-medium tracking-wide transition-colors ${
                  isActive
                    ? "text-alveus-tan-200"
                    : "text-alveus-green-400 hover:text-alveus-green-200"
                }`}
              >
                {icon(isActive)}
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
