import { database } from "../../db";
export { database } from "../../db";
import { ZodError } from "zod";
import { getCurrentUser } from "./auth";
import { isSameOrigin } from "./auth-input";
import { seedPosts } from "./seed";
import type { Post } from "./types";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let seedPromise: Promise<void> | undefined;
export async function seed() {
  if (!seedPromise)
    seedPromise = (async () => {
      const db = database();
      await db.transaction(
        seedPosts.map((p) => ({
          sql: "INSERT INTO posts (id,title,excerpt,content,category,author,owner,image,status,created_at,updated_at,featured) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) ON CONFLICT(id) DO UPDATE SET image=excluded.image WHERE posts.owner='marginly-editorial'",
          values: [
            p.id,
            p.title,
            p.excerpt,
            p.content,
            p.category,
            p.author,
            p.owner,
            p.image,
            p.status,
            p.createdAt,
            p.updatedAt,
            p.featured,
          ],
        })),
      );
    })().catch((error) => {
      seedPromise = undefined;
      throw error;
    });
  await seedPromise;
}
export const postSelect = `SELECT p.id,p.title,p.excerpt,p.content,p.category,p.author,p.owner,p.image,p.status,p.created_at AS "createdAt",p.updated_at AS "updatedAt",p.featured,
 (SELECT COUNT(*)::INTEGER FROM likes l WHERE l.post_id=p.id) AS likes,
 EXISTS(SELECT 1 FROM likes l WHERE l.post_id=p.id AND l.user_id=$1) AS liked,
 EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id=p.id AND b.user_id=$1) AS bookmarked,
 (SELECT COUNT(*)::INTEGER FROM comments c WHERE c.post_id=p.id) AS "commentCount" FROM posts p`;
export function serializePost(p: Post) {
  return { ...p, liked: Boolean(p.liked), bookmarked: Boolean(p.bookmarked) };
}
export async function visiblePost(id: string, userId: string) {
  const { rows } = await database().query<Post>(
    `${postSelect} WHERE p.id=$2 AND (p.status='published' OR p.owner=$1)`,
    [userId, id],
  );
  const p = rows[0];
  if (!p)
    throw new HttpError(
      404,
      "This story isn't available. It may have been removed or is still a draft.",
    );
  return serializePost(p);
}
export async function writer(request: Request) {
  if (!isSameOrigin(request))
    throw new HttpError(
      403,
      "This request couldn't be verified. Reload and try again.",
    );
  const user = await getCurrentUser();
  if (!user)
    throw new HttpError(
      401,
      "Sign in to save your stories and join the conversation.",
    );
  return user;
}
export async function readJson(request: Request) {
  const text = await request.text();
  if (text.length > 60000)
    throw new HttpError(
      413,
      "This story is too long. Keep it under 50,000 characters.",
    );
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(
      400,
      "We couldn't read that request. Please try again.",
    );
  }
}
export function json(data: unknown, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
export function failure(error: unknown) {
  if (error instanceof HttpError)
    return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json({ error: error.issues[0].message }, 400);
  console.error("Marginly request failed", error);
  return json(
    {
      error:
        "Something went wrong. Your unsaved writing is still here. Please try again.",
    },
    503,
  );
}
