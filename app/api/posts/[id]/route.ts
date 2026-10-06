import { getChatGPTUser } from "../../../chatgpt-auth";
import {
  database,
  failure,
  HttpError,
  json,
  readJson,
  seed,
  visiblePost,
  writer,
} from "../../../lib/server";
import { actionInput, postInput } from "../../../lib/validation";
type Context = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";
export async function GET(_: Request, { params }: Context) {
  try {
    await seed();
    const { id } = await params;
    const user = await getChatGPTUser();
    const post = await visiblePost(id, user?.userId ?? "");
    const comments = await database()
      .prepare(
        "SELECT id,author,content,created_at AS createdAt FROM comments WHERE post_id=? ORDER BY created_at ASC",
      )
      .bind(id)
      .all();
    return json({ post, comments: comments.results });
  } catch (error) {
    return failure(error);
  }
}
export async function PUT(request: Request, { params }: Context) {
  try {
    const user = await writer(request);
    const { id } = await params;
    const post = await visiblePost(id, user.userId);
    if (post.owner !== user.userId)
      throw new HttpError(403, "You can only edit your own stories.");
    const input = postInput.parse(await readJson(request));
    await database()
      .prepare(
        "UPDATE posts SET title=?,excerpt=?,content=?,category=?,image=?,status=?,updated_at=? WHERE id=? AND owner=?",
      )
      .bind(
        input.title,
        input.excerpt,
        input.content,
        input.category,
        input.image,
        input.status,
        new Date().toISOString(),
        id,
        user.userId,
      )
      .run();
    return json({ id });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request, { params }: Context) {
  try {
    const user = await writer(request);
    const { id } = await params;
    const post = await visiblePost(id, user.userId);
    if (post.owner !== user.userId)
      throw new HttpError(403, "You can only delete your own stories.");
    const db = database();
    await db.batch([
      db.prepare("DELETE FROM comments WHERE post_id=?").bind(id),
      db.prepare("DELETE FROM bookmarks WHERE post_id=?").bind(id),
      db.prepare("DELETE FROM likes WHERE post_id=?").bind(id),
      db
        .prepare("DELETE FROM posts WHERE id=? AND owner=?")
        .bind(id, user.userId),
    ]);
    return json({ deleted: true });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request, { params }: Context) {
  try {
    const user = await writer(request);
    const { id } = await params;
    await visiblePost(id, user.userId);
    const input = actionInput.parse(await readJson(request));
    const db = database();
    if (input.action === "comment") {
      const comment = {
        id: crypto.randomUUID(),
        author: user.fullName || user.email.split("@")[0],
        content: input.content,
        createdAt: new Date().toISOString(),
      };
      await db
        .prepare(
          "INSERT INTO comments (id,post_id,user_id,author,content,created_at) VALUES (?,?,?,?,?,?)",
        )
        .bind(
          comment.id,
          id,
          user.userId,
          comment.author,
          comment.content,
          comment.createdAt,
        )
        .run();
      return json({ comment }, 201);
    }
    const table = input.action === "like" ? "likes" : "bookmarks";
    if (input.active)
      await db
        .prepare(
          `INSERT OR IGNORE INTO ${table} (post_id,user_id) VALUES (?,?)`,
        )
        .bind(id, user.userId)
        .run();
    else
      await db
        .prepare(`DELETE FROM ${table} WHERE post_id=? AND user_id=?`)
        .bind(id, user.userId)
        .run();
    return json({ post: await visiblePost(id, user.userId) });
  } catch (error) {
    return failure(error);
  }
}
