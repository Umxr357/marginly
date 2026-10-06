import { getCurrentUser } from "../../../lib/auth";
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
    const user = await getCurrentUser();
    const post = await visiblePost(id, user?.userId ?? "");
    const comments = await database().query(
      'SELECT id,author,content,created_at AS "createdAt" FROM comments WHERE post_id=$1 ORDER BY created_at ASC',
      [id],
    );
    return json({ post, comments: comments.rows });
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
    await database().query(
      "UPDATE posts SET title=$1,excerpt=$2,content=$3,category=$4,image=$5,status=$6,updated_at=$7 WHERE id=$8 AND owner=$9",
      [
        input.title,
        input.excerpt,
        input.content,
        input.category,
        input.image,
        input.status,
        new Date().toISOString(),
        id,
        user.userId,
      ],
    );
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
    // Foreign keys remove this story's comments, bookmarks and likes atomically.
    await database().query("DELETE FROM posts WHERE id=$1 AND owner=$2", [
      id,
      user.userId,
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
      await db.query(
        "INSERT INTO comments (id,post_id,user_id,author,content,created_at) VALUES ($1,$2,$3,$4,$5,$6)",
        [
          comment.id,
          id,
          user.userId,
          comment.author,
          comment.content,
          comment.createdAt,
        ],
      );
      return json({ comment }, 201);
    }
    const table = input.action === "like" ? "likes" : "bookmarks";
    if (input.active)
      await db.query(
        `INSERT INTO ${table} (post_id,user_id) VALUES ($1,$2) ON CONFLICT (post_id,user_id) DO NOTHING`,
        [id, user.userId],
      );
    else
      await db.query(`DELETE FROM ${table} WHERE post_id=$1 AND user_id=$2`, [
        id,
        user.userId,
      ]);
    return json({ post: await visiblePost(id, user.userId) });
  } catch (error) {
    return failure(error);
  }
}
