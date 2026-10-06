import { z } from "zod";

export const loginInput = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(254),
  password: z
    .string()
    .min(10, "Use at least 10 characters for your password.")
    .max(128, "Keep your password under 129 characters."),
});
export const registerInput = loginInput.extend({
  name: z
    .string()
    .trim()
    .min(2, "Enter a name with at least 2 characters.")
    .max(80),
});

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  // Render terminates HTTPS before forwarding to Node. Use its public URL
  // instead of the internal HTTP address when checking browser mutations.
  const expected = new URL(
    process.env.APP_ORIGIN || process.env.RENDER_EXTERNAL_URL || request.url,
  ).origin;
  return (
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    (!origin || origin === expected)
  );
}
