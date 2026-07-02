import { useState } from "react";

import { AmbassadorsView } from "~/components/AmbassadorsView";
import { Header } from "~/components/Header";
import { LiveView } from "~/components/LiveView";
import { NavBar } from "~/components/NavBar";
import { ScheduleView } from "~/components/ScheduleView";
import { SettingsView } from "~/components/SettingsView";

export type Tab = "live" | "schedule" | "ambassadors" | "settings";

export function App() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div className="flex h-full flex-col bg-alveus-green-900 text-white antialiased">
      <Header />

      <main className="relative min-h-0 flex-1 overflow-y-auto bg-alveus-tan-100 topo-bg text-alveus-green-900">
        {tab === "live" && <LiveView />}
        {tab === "schedule" && <ScheduleView />}
        {tab === "ambassadors" && <AmbassadorsView />}
        {tab === "settings" && <SettingsView />}
      </main>

      <NavBar active={tab} onChange={setTab} />
    </div>
  );
}
