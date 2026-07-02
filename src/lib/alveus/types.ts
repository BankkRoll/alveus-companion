import { z } from "zod";

export const calendarEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string().nullable(),
  link: z.string().nullable(),
  startAt: z.string(),
  hasTime: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  tag: z.enum(["stream", "video", "announcements"]),
  linkUrl: z.string().nullable(),
  imageUrl: z.string().nullable(),
  vodUrl: z.string().nullable(),
  createdAt: z.string(),
  expiresAt: z.string().nullable(),
  canceledAt: z.string().nullable(),
  urgency: z.string(),
  isPush: z.boolean(),
});

export const trpcResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    result: z.object({ data: z.object({ json: dataSchema }) }),
  });

export type CalendarEvent = z.infer<typeof calendarEventSchema>;
export type AlveusNotification = z.infer<typeof notificationSchema>;
