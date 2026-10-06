import { z } from "zod";
export const postInput = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give your story a title of at least 3 characters.")
    .max(140),
  excerpt: z
    .string()
    .trim()
    .min(10, "Add a short description of at least 10 characters.")
    .max(300),
  content: z
    .string()
    .trim()
    .min(30, "Write at least 30 characters before saving.")
    .max(50000),
  category: z.enum(["Design", "Technology", "Culture", "Travel", "Creativity"]),
  image: z
    .string()
    .max(2000)
    .refine((value) => {
      if (!value) return true;
      try {
        const url = new URL(value);
        return url.protocol === "https:";
      } catch {
        return false;
      }
    }, "Use a valid HTTPS image URL, or leave it empty."),
  status: z.enum(["draft", "published"]),
});
export const actionInput = z.discriminatedUnion("action", [
  z.object({ action: z.literal("bookmark"), active: z.boolean() }),
  z.object({ action: z.literal("like"), active: z.boolean() }),
  z.object({
    action: z.literal("comment"),
    content: z.string().trim().min(1, "Write a comment first.").max(2000),
  }),
]);
