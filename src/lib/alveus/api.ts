import { z } from "zod";

import {
  type AlveusNotification,
  type CalendarEvent,
  calendarEventSchema,
  notificationSchema,
  trpcResponseSchema,
} from "./types";

const TRPC_BASE = "https://www.alveussanctuary.org/api/trpc";

/**
 * Executes a tRPC query against the Alveus Sanctuary public API.
 *
 * @param procedure - Fully-qualified tRPC procedure name, e.g. `"calendarEvents.getCalendarEvents"`
 * @param input - Optional input object serialized as the `input` query parameter
 */
async function trpcQuery<T>(procedure: string, input?: unknown): Promise<T> {
  const url = new URL(`${TRPC_BASE}/${procedure}`);
  if (input !== undefined) {
    url.searchParams.set("input", JSON.stringify({ json: input }));
  }

  const response = await fetch(url.toString(), {
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Alveus tRPC "${procedure}" failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/** Fetches all upcoming calendar events from the Alveus Sanctuary public API. */
export async function fetchCalendarEvents(): Promise<CalendarEvent[]> {
  const schema = trpcResponseSchema(z.array(calendarEventSchema));
  const data = await trpcQuery<z.infer<typeof schema>>(
    "calendarEvents.getCalendarEvents",
  );
  return schema.parse(data).result.data.json;
}

const notificationsResponseSchema = trpcResponseSchema(
  z.object({
    items: z.array(notificationSchema),
    nextCursor: z.string().nullable(),
  }),
);

/**
 * Fetches recent Alveus notifications filtered by tag.
 *
 * @param tags - Notification tags to include. Stream notifications are handled via Twitch GQL instead.
 * @param cursor - Optional pagination cursor from a previous response.
 */
export async function fetchNotifications(
  tags: Array<"stream" | "video" | "announcements">,
  cursor?: string,
): Promise<{ items: AlveusNotification[]; nextCursor: string | null }> {
  const data = await trpcQuery<z.infer<typeof notificationsResponseSchema>>(
    "notifications.getRecentNotificationsForTags",
    { tags, ...(cursor ? { cursor } : {}) },
  );
  return notificationsResponseSchema.parse(data).result.data.json;
}
