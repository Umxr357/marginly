"use client";
import { useCallback, useEffect, useState } from "react";
import { Bookmark, Heart, MessageCircle, PenLine } from "lucide-react";
import type { Comment, Post, Viewer } from "../lib/types";
import { formatDate, readingTime } from "../lib/types";
import { api } from "../lib/client";
import { Byline, Cover, Loading, Empty } from "./folio";
export function Article({
  id,
  viewer,
  onUpdate,
  onReact,
  busy,
  syncedPost,
  notify,
}: {
  id: string;
  viewer: Viewer;
  onUpdate: (p: Post) => void;
  onReact: (p: Post, action: "like" | "bookmark") => void;
  busy: boolean;
  syncedPost?: Post;
  notify: (s: string) => void;
}) {
  const [loadedPost, setLoadedPost] = useState<Post | null>(null);
  const post = syncedPost ?? loadedPost;
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [commentError, setCommentError] = useState("");
  const load = useCallback(async () => {
    try {
      const result = await api<{ post: Post; comments: Comment[] }>(
        `/api/posts/${id}`,
      );
      setLoadedPost(result.post);
      setComments(result.comments);
      onUpdate(result.post);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id, onUpdate]);
  useEffect(() => {
    // Initial API synchronization updates state only after the request settles.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);
  function retry() {
    setLoading(true);
    setError("");
    void load();
  }
  useEffect(() => {
    if (post) document.title = `${post.title} — Marginly`;
  }, [post]);
  async function comment(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    setSending(true);
    setCommentError("");
    try {
      const result = await api<{ comment: Comment }>(`/api/posts/${id}`, {
        method: "POST",
        body: JSON.stringify({ action: "comment", content }),
      });
      setComments((list) => [...list, result.comment]);
      setContent("");
      notify("Your comment has been added");
    } catch (err) {
      setCommentError((err as Error).message);
    } finally {
      setSending(false);
    }
  }
  if (loading) return <Loading />;
  if (error || !post)
    return (
      <div className="page-space">
        <Empty
          title="This story isn't available"
          description={error || "It may have been removed or is still a draft."}
        >
          <div className="button-row">
            <a className="secondary" href="/">
              Explore stories
            </a>
            <button className="primary" onClick={retry}>
              Try again
            </button>
          </div>
        </Empty>
      </div>
    );
  return (
    <article className="reader">
      <a className="breadcrumb" href="/">
        Explore / {post.category}
      </a>
      <div className="eyebrow">
        {post.category} · {readingTime(post.content)} MIN READ{" "}
        {post.status === "draft" && "· DRAFT"}
      </div>
      <h1>{post.title}</h1>
      <p className="reader-excerpt">{post.excerpt}</p>
      <div className="article-meta">
        <Byline post={post} />
        {post.owner === viewer?.userId && (
          <a href={`/edit/${post.id}`} className="secondary">
            <PenLine size={15} />
            Edit story
          </a>
        )}
      </div>
      <Cover post={post} />
      <div className="article-body">
        <Prose content={post.content} />
        <div className="article-reactions">
          <button
            className={`secondary ${post.liked ? "is-active" : ""}`}
            disabled={busy}
            aria-pressed={post.liked}
            aria-label={post.liked ? "Unlike story" : "Like story"}
            onClick={() => onReact(post, "like")}
          >
            <Heart size={18} fill={post.liked ? "currentColor" : "none"} />
            {post.likes} {post.likes === 1 ? "like" : "likes"}
          </button>
          <button
            className={`secondary ${post.bookmarked ? "is-active" : ""}`}
            disabled={busy}
            aria-pressed={post.bookmarked}
            onClick={() => onReact(post, "bookmark")}
          >
            <Bookmark
              size={18}
              fill={post.bookmarked ? "currentColor" : "none"}
            />
            {post.bookmarked ? "Saved" : "Save for later"}
          </button>
          <a className="comment-count" href="#comments">
            <MessageCircle size={18} />
            {comments.length}
          </a>
        </div>
        <section id="comments" className="comments">
          <h2>
            Join the conversation <span>{comments.length}</span>
          </h2>
          {viewer ? (
            <form onSubmit={comment}>
              <label htmlFor="comment">What&apos;s your perspective?</label>
              <textarea
                id="comment"
                required
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Add something to the conversation…"
                rows={4}
              />
              {commentError && (
                <p className="error-banner" role="alert">
                  {commentError}
                </p>
              )}
              <button className="primary" disabled={sending || !content.trim()}>
                {sending ? "Posting…" : "Post comment"}
              </button>
            </form>
          ) : (
            <p>
              <a
                className="text-link"
                href={`/signin?return_to=${encodeURIComponent(`/post/${id}`)}`}
              >
                Sign in
              </a>{" "}
              to share your thoughts.
            </p>
          )}
          {comments.length ? (
            comments.map((c) => (
              <div className="comment" key={c.id}>
                <div>
                  <strong>{c.author}</strong>
                  <span>{formatDate(c.createdAt)}</span>
                </div>
                <p>{c.content}</p>
              </div>
            ))
          ) : (
            <p className="quiet">Be the first to add a thought.</p>
          )}
        </section>
      </div>
    </article>
  );
}
export function Prose({ content }: { content: string }) {
  return (
    <>
      {content
        .split(/\n\s*\n/)
        .map((part, i) =>
          part.startsWith("## ") ? (
            <h2 key={i}>{part.slice(3)}</h2>
          ) : part.startsWith("> ") ? (
            <blockquote key={i}>{part.slice(2)}</blockquote>
          ) : (
            <p key={i}>{part}</p>
          ),
        )}
    </>
  );
}
