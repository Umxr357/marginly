import { getChatGPTUser } from "../../chatgpt-auth";
import {
  database,
  failure,
  json,
  postSelect,
  readJson,
  seed,
  serializePost,
  writer,
} from "../../lib/server";
import { postInput } from "../../lib/validation";
import type { Post } from "../../lib/types";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await seed();
    const user = await getChatGPTUser();
    const result = await database()
      .prepare(
        `${postSelect} WHERE p.status='published' OR p.owner=?1 ORDER BY p.created_at DESC`,
      )
      .bind(user?.userId ?? "")
      .all<Post>();
    return json({
      posts: result.results.map(serializePost),
      viewer: user
        ? {
            userId: user.userId,
            displayName: user.fullName || user.email.split("@")[0],
          }
        : null,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await writer(request);
    const input = postInput.parse(await readJson(request));
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await database()
      .prepare(
        "INSERT INTO posts (id,title,excerpt,content,category,author,owner,image,status,created_at,updated_at,featured) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)",
      )
      .bind(
        id,
        input.title,
        input.excerpt,
        input.content,
        input.category,
        user.fullName || user.email.split("@")[0],
        user.userId,
        input.image,
        input.status,
        now,
        now,
      )
      .run();
    return json({ id }, 201);
  } catch (error) {
    return failure(error);
  }
}
