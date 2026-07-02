import { useState } from "react";

import type { CalendarEvent } from "~/lib/alveus/types";
import { calendarEventsStorage } from "~/lib/storage";

import { useStorage } from "./hooks/useStorage";

const ALVEUS_ICAL = "webcal://alveus.gg/updates/ical";
const MAYA_ICAL = "webcal://alveus.gg/updates/ical/maya";
const ALVEUS_GCAL = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(ALVEUS_ICAL)}`;
const MAYA_GCAL = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(MAYA_ICAL)}`;

interface CategoryStyle {
  dot: string;
  bg: string;
  text: string;
  border: string;
  legend: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  "Alveus Regular Stream": {
    dot: "bg-[#4a7c59]",
    bg: "bg-[#4a7c59]/10",
    border: "border-[#4a7c59]/25",
    text: "text-[#2c5940]",
    legend: "bg-[#4a7c59]",
  },
  "Alveus Special Stream": {
    dot: "bg-[#357a50]",
    bg: "bg-[#357a50]/10",
    border: "border-[#357a50]/25",
    text: "text-[#1e5232]",
    legend: "bg-[#357a50]",
  },
  "Alveus Collaboration Stream": {
    dot: "bg-[#3b5a8f]",
    bg: "bg-[#3b5a8f]/10",
    border: "border-[#3b5a8f]/25",
    text: "text-[#2a4168]",
    legend: "bg-[#3b5a8f]",
  },
  "Alveus Ambassador Birthday": {
    dot: "bg-[#c1669e]",
    bg: "bg-[#c1669e]/10",
    border: "border-[#c1669e]/25",
    text: "text-[#7f0d45]",
    legend: "bg-[#c1669e]",
  },
  "Alveus YouTube Video": {
    dot: "bg-[#c0392b]",
    bg: "bg-[#c0392b]/10",
    border: "border-[#c0392b]/25",
    text: "text-[#922b21]",
    legend: "bg-[#c0392b]",
  },
  "Maya Stream": {
    dot: "bg-[#2980b9]",
    bg: "bg-[#2980b9]/10",
    border: "border-[#2980b9]/25",
    text: "text-[#1a5276]",
    legend: "bg-[#2980b9]",
  },
  "Maya YouTube Video": {
    dot: "bg-[#8e44ad]",
    bg: "bg-[#8e44ad]/10",
    border: "border-[#8e44ad]/25",
    text: "text-[#6c3483]",
    legend: "bg-[#8e44ad]",
  },
};

const LEGEND_ALVEUS = [
  "Alveus Regular Stream",
  "Alveus Special Stream",
  "Alveus Collaboration Stream",
  "Alveus Ambassador Birthday",
  "Alveus YouTube Video",
];
const LEGEND_MAYA = ["Maya Stream", "Maya YouTube Video"];

function categoryStyle(category: string | null): CategoryStyle {
  const cat = category ?? "";
  return (
    CATEGORY_STYLES[cat] ?? {
      dot: "bg-alveus-green-600",
      bg: "bg-alveus-green-600/10",
      border: "border-alveus-green-600/20",
      text: "text-alveus-green-800",
      legend: "bg-alveus-green-600",
    }
  );
}

function localDateKey(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function formatTime(startAt: string, hasTime: boolean): string {
  if (!hasTime) return "All day";
  return new Date(startAt).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns the grid cells for a calendar month. Cells before day-1 are null. */
function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDow = startOfMonth(year, month).getDay();
  const total = daysInMonth(year, month);
  const cells: (number | null)[] = Array(firstDow).fill(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function CalendarButtons() {
  function copyIcal(url: string) {
    navigator.clipboard.writeText(url).catch(() => undefined);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-alveus-green-200 px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
          Alveus
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={ALVEUS_GCAL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-alveus-green-700 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-alveus-green-600"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect
                x="1"
                y="2"
                width="9"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M1 5h9" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M4 1v2M7 1v2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Add to Google Calendar
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M2 1h5v5M7 1L1 7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </a>
          <button
            onClick={() => copyIcal(ALVEUS_ICAL)}
            title="Copy webcal link"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-[11px] font-medium text-alveus-green-700 ring-1 ring-alveus-green-200 transition-colors hover:bg-white hover:text-alveus-green-900"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3.5 6.5L1 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M4 3l1-1a2.12 2.12 0 0 1 3 3l-1 1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M6 7l-1 1a2.12 2.12 0 0 1-3-3l1-1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            webcal://alveus.gg/updates/ical
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
          Maya
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={MAYA_GCAL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-alveus-green-700 px-3 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-alveus-green-600"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <rect
                x="1"
                y="2"
                width="9"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path d="M1 5h9" stroke="currentColor" strokeWidth="1.2" />
              <path
                d="M4 1v2M7 1v2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Add to Google Calendar
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M2 1h5v5M7 1L1 7"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </a>
          <button
            onClick={() => copyIcal(MAYA_ICAL)}
            title="Copy webcal link"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-3 py-1.5 text-[11px] font-medium text-alveus-green-700 ring-1 ring-alveus-green-200 transition-colors hover:bg-white hover:text-alveus-green-900"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M3.5 6.5L1 9"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M4 3l1-1a2.12 2.12 0 0 1 3 3l-1 1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M6 7l-1 1a2.12 2.12 0 0 1-3-3l1-1"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            webcal://alveus.gg/updates/ical/maya
          </button>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-col gap-2.5 border-b border-alveus-green-200 px-4 py-3">
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
          Alveus
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {LEGEND_ALVEUS.map((cat) => {
            const s = categoryStyle(cat);
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`size-2.5 shrink-0 rounded-sm ${s.legend}`} />
                <span className="text-[10px] text-alveus-green-700">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 border-t border-alveus-green-100 pt-2.5">
        <p className="text-[10px] font-bold tracking-widest text-alveus-green-600 uppercase">
          Maya
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {LEGEND_MAYA.map((cat) => {
            const s = categoryStyle(cat);
            return (
              <div key={cat} className="flex items-center gap-1.5">
                <span className={`size-2.5 shrink-0 rounded-sm ${s.legend}`} />
                <span className="text-[10px] text-alveus-green-700">{cat}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function groupByDay(events: CalendarEvent[]): Map<string, CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const key = localDateKey(new Date(e.startAt));
    const bucket = map.get(key) ?? [];
    bucket.push(e);
    map.set(key, bucket);
  }
  return map;
}

function DayHeader({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr + "T12:00:00");
  const todayKey = localDateKey(new Date());
  const tomorrowKey = localDateKey(new Date(Date.now() + 86_400_000));
  const isToday = dateStr === todayKey;
  const isTomorrow = dateStr === tomorrowKey;

  return (
    <div className="flex items-baseline gap-2 py-1">
      <span
        className={`text-[13px] font-bold ${isToday ? "text-alveus-green-700" : "text-alveus-green-900"}`}
      >
        {isToday
          ? "Today"
          : isTomorrow
            ? "Tomorrow"
            : date.toLocaleDateString(undefined, { weekday: "long" })}
      </span>
      <span className="text-[11px] text-alveus-green-500">
        {date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
      </span>
    </div>
  );
}

function EventRow({ event }: { event: CalendarEvent }) {
  const s = categoryStyle(event.category);
  const time = formatTime(event.startAt, event.hasTime);

  const inner = (
    <div
      className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${s.bg} ${s.border} transition-all hover:brightness-95`}
    >
      <div className={`mt-1.5 size-2 shrink-0 rounded-full ${s.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug font-medium text-alveus-green-900">
          {event.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] text-alveus-green-500">{time}</span>
          {event.category && (
            <>
              <span className="text-alveus-green-300">·</span>
              <span className={`text-[11px] ${s.text}`}>{event.category}</span>
            </>
          )}
        </div>
      </div>
      {event.link && (
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          className="mt-1 shrink-0 text-alveus-green-400"
        >
          <path
            d="M4 2h5v5M9 2L2 9"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  );

  return event.link ? (
    <a href={event.link} target="_blank" rel="noreferrer" className="block">
      {inner}
    </a>
  ) : (
    <div>{inner}</div>
  );
}

function ListView({ events }: { events: CalendarEvent[] }) {
  const grouped = groupByDay(events);
  const days = Array.from(grouped.entries());

  return (
    <div className="flex flex-col gap-4 p-4">
      {days.map(([dateStr, dayEvents]) => (
        <section key={dateStr}>
          <DayHeader dateStr={dateStr} />
          <div className="flex flex-col gap-1.5 pt-1">
            {dayEvents.map((e) => (
              <EventRow key={e.id} event={e} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarGrid({
  events,
  year,
  month,
  onPrev,
  onNext,
}: {
  events: CalendarEvent[];
  year: number;
  month: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const cells = buildMonthGrid(year, month);
  const todayKey = localDateKey(new Date());

  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const d = new Date(e.startAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = localDateKey(d);
      const bucket = eventsByDay.get(key) ?? [];
      bucket.push(e);
      eventsByDay.set(key, bucket);
    }
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onPrev}
          className="flex size-7 items-center justify-center rounded-lg text-alveus-green-600 transition-colors hover:bg-alveus-green-100 hover:text-alveus-green-900"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M9 2L4 7l5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <span className="text-[14px] font-bold text-alveus-green-900">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={onNext}
          className="flex size-7 items-center justify-center rounded-lg text-alveus-green-600 transition-colors hover:bg-alveus-green-100 hover:text-alveus-green-900"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M5 2l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-alveus-green-200">
        {DOW_LABELS.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center text-[9px] font-bold tracking-widest text-alveus-green-500 uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="min-h-15 border-r border-b border-alveus-green-100"
              />
            );
          }

          const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayEvents = eventsByDay.get(dateKey) ?? [];
          const isToday = dateKey === todayKey;

          return (
            <div
              key={dateKey}
              className={`relative flex min-h-15 flex-col border-r border-b border-alveus-green-100 p-1 ${isToday ? "bg-alveus-green-50" : ""}`}
            >
              <span
                className={[
                  "mb-1 flex size-5 items-center justify-center self-end rounded-full text-[10px] font-semibold",
                  isToday
                    ? "bg-alveus-green-600 text-white"
                    : "text-alveus-green-500",
                ].join(" ")}
              >
                {day}
              </span>

              <div className="flex flex-col gap-0.5">
                {dayEvents.slice(0, 3).map((e) => {
                  const s = categoryStyle(e.category);
                  const pill = (
                    <div
                      className={`w-full truncate rounded px-1 py-0.5 text-[8px] leading-tight font-medium ${s.bg} ${s.text} border ${s.border}`}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  );
                  return e.link ? (
                    <a
                      key={e.id}
                      href={e.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {pill}
                    </a>
                  ) : (
                    <div key={e.id}>{pill}</div>
                  );
                })}
                {dayEvents.length > 3 && (
                  <div className="px-1 text-[8px] text-alveus-green-500">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScheduleView() {
  const [events] = useStorage<CalendarEvent[]>(calendarEventsStorage, []);
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const upcoming = events
    .filter((e) => new Date(e.startAt) >= new Date(Date.now() - 3_600_000))
    .sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    )
    .slice(0, 90);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else setViewMonth((m) => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else setViewMonth((m) => m + 1);
  }

  const isEmpty = upcoming.length === 0;

  return (
    <div className="@container flex flex-col">
      <CalendarButtons />
      <Legend />

      {isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-alveus-green-100">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect
                x="3"
                y="4"
                width="16"
                height="15"
                rx="2.5"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-alveus-green-500"
              />
              <path
                d="M3 9h16"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-alveus-green-400"
              />
              <path
                d="M8 2v3M14 2v3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="text-alveus-green-500"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-alveus-green-900">
              No upcoming events
            </p>
            <p className="mt-0.5 text-xs text-alveus-green-600">
              Check back soon
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="@[500px]:hidden">
            <ListView events={upcoming} />
          </div>
          <div className="hidden @[500px]:flex @[500px]:flex-col">
            <CalendarGrid
              events={events}
              year={viewYear}
              month={viewMonth}
              onPrev={prevMonth}
              onNext={nextMonth}
            />
          </div>
        </>
      )}
    </div>
  );
}
