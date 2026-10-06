"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Moon,
  Sun,
  BookOpen,
  X,
  PenLine,
  Bookmark,
  Check,
  Trash2,
  Heart,
  SlidersHorizontal,
} from "lucide-react";
import {
  categories,
  formatDate,
  readingTime,
  type Post,
  type Viewer,
} from "../lib/types";
import { Editor } from "./editor";
import { Article } from "./article";
import { api } from "../lib/client";
import { useStoryTools } from "../lib/webmcp";
export type View =
  "explore" | "bookmarks" | "manage" | "write" | "edit" | "post";
export function Marginly({
  view = "explore",
  id,
}: {
  view?: View;
  id?: string;
}) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [viewer, setViewer] = useState<Viewer>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("All stories");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [status, setStatus] = useState("all");
  const [dark, setDark] = useState(false);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState<string[]>([]);
  const busyIds = useRef(new Set<string>());
  const [deleting, setDeleting] = useState<Post | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api<{ posts: Post[]; viewer: Viewer }>("/api/posts");
      setPosts(data.posts);
      setViewer(data.viewer);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    try {
      const value =
        localStorage.getItem("marginly-theme") ??
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      setDark(value === "dark");
      document.documentElement.dataset.theme = value;
    } catch {
      /* Preferences are optional. */
    }
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (deleting) dialog.current?.showModal();
    else dialog.current?.close();
  }, [deleting]);
  function theme() {
    setDark(!dark);
    document.documentElement.dataset.theme = dark ? "light" : "dark";
    try {
      localStorage.setItem("marginly-theme", dark ? "light" : "dark");
    } catch {}
  }
  const notify = useCallback((message: string) => setToast(message), []);
  const update = useCallback(
    (post: Post) =>
      setPosts((list) => list.map((p) => (p.id === post.id ? post : p))),
    [],
  );
  async function react(post: Post, action: "bookmark" | "like") {
    if (!viewer) {
      setToast("Sign in to save stories and show your appreciation.");
      return;
    }
    if (busyIds.current.has(post.id)) return;
    busyIds.current.add(post.id);
    setBusy([...busyIds.current]);
    try {
      const result = await api<{ post: Post }>(`/api/posts/${post.id}`, {
        method: "POST",
        body: JSON.stringify({
          action,
          active: action === "bookmark" ? !post.bookmarked : !post.liked,
        }),
      });
      update(result.post);
      if (action === "bookmark")
        setToast(
          result.post.bookmarked
            ? "Added to your reading list"
            : "Removed from your reading list",
        );
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      busyIds.current.delete(post.id);
      setBusy([...busyIds.current]);
    }
  }
  async function remove() {
    if (!deleting) return;
    setBusy([deleting.id]);
    try {
      await api(`/api/posts/${deleting.id}`, { method: "DELETE" });
      setPosts((list) => list.filter((p) => p.id !== deleting.id));
      setDeleting(null);
      setToast("Story deleted");
    } catch (e) {
      setToast((e as Error).message);
    } finally {
      setBusy([]);
    }
  }
  const published = posts.filter((p) => p.status === "published");
  const source =
    view === "manage"
      ? posts.filter((p) => p.owner === viewer?.userId)
      : view === "bookmarks"
        ? posts.filter((p) => p.bookmarked)
        : published;
  const filtered = source
    .filter(
      (p) =>
        (category === "All stories" || p.category === category) &&
        (status === "all" || p.status === status) &&
        `${p.title} ${p.excerpt} ${p.author} ${p.category}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : sort === "popular"
          ? b.likes - a.likes
          : b.createdAt.localeCompare(a.createdAt),
    );
  const featured = published.find((p) => p.featured);
  const showFeature =
    view === "explore" &&
    category === "All stories" &&
    !query &&
    sort === "newest" &&
    featured;
  const grid = showFeature
    ? filtered.filter((p) => p.id !== featured.id)
    : filtered;
  useStoryTools(view, posts, setQuery, setCategory);
  const current = posts.find((p) => p.id === id);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="header">
        <a className="brand" href="/" aria-label="Marginly home">
          marginly<span aria-hidden="true">✳</span>
        </a>
        <nav aria-label="Main navigation">
          <a className={view === "explore" ? "active" : ""} href="/">
            Explore
          </a>
          <a className={view === "bookmarks" ? "active" : ""} href="/bookmarks">
            Bookmarks
          </a>
          <a className={view === "manage" ? "active" : ""} href="/manage">
            My stories
          </a>
        </nav>
        <div className="header-actions">
          <button
            className="icon-button"
            aria-label={dark ? "Use light mode" : "Use dark mode"}
            onClick={theme}
          >
            {dark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <a className="primary" href="/write">
            <PenLine size={16} />
            Write a story
          </a>
          {viewer ? (
            <span
              className="profile-avatar"
              title={`Signed in as ${viewer.displayName}`}
            >
              {viewer.displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            !loading && (
              <a
                className="sign-in"
                href={`/signin-with-chatgpt?return_to=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
                target="_top"
              >
                Sign in
              </a>
            )
          )}
        </div>
      </header>
      <main id="main-content" className={`main view-${view}`}>
        {view === "post" ? (
          <Article
            id={id!}
            viewer={viewer}
            onUpdate={update}
            onReact={react}
            busy={busy.includes(id!)}
            syncedPost={current}
            notify={notify}
          />
        ) : view === "write" || view === "edit" ? (
          loading ? (
            <Loading />
          ) : error ? (
            <Unavailable error={error} retry={reload} />
          ) : !viewer ? (
            <SignIn
              title="Your next story starts here"
              description="Sign in to write, save drafts, and share your perspective."
            />
          ) : view === "edit" &&
            (!current || current.owner !== viewer.userId) ? (
            <Empty
              title="This story can't be edited"
              description="You can edit stories you've written. Start a new one or return to your library."
            />
          ) : (
            <Editor
              post={view === "edit" ? current : undefined}
              notify={notify}
            />
          )
        ) : (
          <>
            <div className="intro">
              <div>
                <div className="eyebrow">
                  {view === "explore"
                    ? "THE MARGINLY JOURNAL"
                    : view === "bookmarks"
                      ? "YOUR PERSONAL COLLECTION"
                      : "THE WRITER'S DESK"}
                </div>
                <h1>
                  {view === "explore" ? (
                    <>
                      Good stories.
                      <br />
                      <em>Unexpected perspectives.</em>
                    </>
                  ) : view === "bookmarks" ? (
                    <>
                      Good stories,
                      <br />
                      <em>kept close.</em>
                    </>
                  ) : (
                    <>
                      Your words.
                      <br />
                      <em>A world of possibility.</em>
                    </>
                  )}
                </h1>
                <p>
                  {view === "explore"
                    ? "An independent journal for curious minds. Find a new perspective. Leave one of your own."
                    : view === "bookmarks"
                      ? "A little library of things you want to come back to."
                      : "From a first thought to a finished piece. Make it yours."}
                </p>
              </div>
              <div className="edition">
                <span className="edition-symbol" aria-hidden="true">
                  ✳
                </span>
                A LITTLE OUTSIDE
                <br />
                THE ORDINARY.
                <span>Made for curious minds.</span>
              </div>
            </div>
            {loading ? (
              <Loading />
            ) : error ? (
              <Unavailable error={error} retry={reload} />
            ) : view !== "explore" && !viewer ? (
              <SignIn
                title={
                  view === "bookmarks"
                    ? "Make room for your next read"
                    : "A home for your words"
                }
                description="Sign in to keep your stories and reading list together."
              />
            ) : (
              <>
                <div className="discovery">
                  <div className="category-list">
                    {categories.map((item) => (
                      <button
                        key={item}
                        aria-pressed={category === item}
                        className={category === item ? "chip selected" : "chip"}
                        onClick={() => setCategory(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <label className="search">
                    <Search size={18} />
                    <input
                      aria-label="Search stories"
                      placeholder="Find your next read…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={16} />
                      </button>
                    )}
                  </label>
                </div>
                {showFeature && (
                  <section className="feature">
                    <a
                      className="feature-image"
                      href={`/post/${featured.id}`}
                      aria-label={`Read ${featured.title}`}
                    >
                      <Cover post={featured} />
                      <span className="feature-badge">EDITOR'S PICK</span>
                    </a>
                    <div className="feature-copy">
                      <span className="category-text">
                        {featured.category}
                        <span>• {readingTime(featured.content)} MIN READ</span>
                      </span>
                      <h2>
                        <a href={`/post/${featured.id}`}>{featured.title}</a>
                      </h2>
                      <p>{featured.excerpt}</p>
                      <div className="feature-bottom">
                        <Byline post={featured} />
                        <button
                          className={`icon-button ${featured.bookmarked ? "is-active" : ""}`}
                          aria-label={
                            featured.bookmarked
                              ? "Remove featured bookmark"
                              : "Bookmark featured story"
                          }
                          aria-pressed={featured.bookmarked}
                          disabled={busy.includes(featured.id)}
                          onClick={() => react(featured, "bookmark")}
                        >
                          <Bookmark
                            size={19}
                            fill={featured.bookmarked ? "currentColor" : "none"}
                          />
                        </button>
                      </div>
                    </div>
                  </section>
                )}
                <section className="stories">
                  <div className="section-heading">
                    <div>
                      <h2>
                        {query
                          ? `Results for “${query}”`
                          : view === "manage"
                            ? "My stories"
                            : view === "bookmarks"
                              ? "Your reading list"
                              : category === "All stories"
                                ? "The latest stories"
                                : `${category} stories`}
                      </h2>
                      <span className="result-count" aria-live="polite">
                        {grid.length} {grid.length === 1 ? "story" : "stories"}
                      </span>
                    </div>
                    <div className="list-controls">
                      {view === "manage" && (
                        <select
                          aria-label="Filter by status"
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                        >
                          <option value="all">All statuses</option>
                          <option value="draft">Drafts</option>
                          <option value="published">Published</option>
                        </select>
                      )}
                      <label className="sort-control">
                        <SlidersHorizontal size={14} />
                        <select
                          aria-label="Sort stories"
                          value={sort}
                          onChange={(e) => setSort(e.target.value)}
                        >
                          <option value="newest">Newest first</option>
                          <option value="oldest">Oldest first</option>
                          <option value="popular">Most liked</option>
                        </select>
                      </label>
                    </div>
                  </div>
                  {grid.length ? (
                    <div className="post-grid">
                      {grid.map((post) => (
                        <article className="post-card" key={post.id}>
                          <div className="card-image">
                            <a
                              className="cover-button"
                              aria-label={`Read ${post.title}`}
                              href={`/post/${post.id}`}
                            >
                              <Cover post={post} />
                            </a>
                            <button
                              className={`save-button ${post.bookmarked ? "is-active" : ""}`}
                              disabled={busy.includes(post.id)}
                              aria-label={`${post.bookmarked ? "Remove bookmark from" : "Bookmark"} ${post.title}`}
                              aria-pressed={post.bookmarked}
                              onClick={() => react(post, "bookmark")}
                            >
                              <Bookmark
                                size={17}
                                fill={post.bookmarked ? "currentColor" : "none"}
                              />
                            </button>
                            {post.status === "draft" && (
                              <span className="draft-badge">DRAFT</span>
                            )}
                          </div>
                          <div className="card-meta">
                            <span className="category-text">
                              {post.category}
                            </span>
                            <span>{readingTime(post.content)} min read</span>
                          </div>
                          <h3>
                            <a href={`/post/${post.id}`}>{post.title}</a>
                          </h3>
                          <p>{post.excerpt}</p>
                          <div className="card-bottom">
                            <Byline post={post} />
                            {view === "manage" ? (
                              <div className="card-actions">
                                <a
                                  className="icon-button"
                                  href={`/edit/${post.id}`}
                                  aria-label={`Edit ${post.title}`}
                                >
                                  <PenLine size={17} />
                                </a>
                                <button
                                  className="icon-button"
                                  aria-label={`Delete ${post.title}`}
                                  onClick={() => setDeleting(post)}
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            ) : (
                              <span className="like-count">
                                <Heart size={14} />
                                {post.likes}
                              </span>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title={
                        query || category !== "All stories" || status !== "all"
                          ? "No stories found"
                          : view === "manage"
                            ? "Every story starts with a first line"
                            : view === "bookmarks"
                              ? "Your reading list is a blank page"
                              : "The next story is on its way"
                      }
                      description={
                        query || category !== "All stories" || status !== "all"
                          ? "Try another keyword, topic, or status."
                          : view === "bookmarks"
                            ? "Tap the bookmark on any story to save it for later."
                            : "Bring an idea, an experience, or a fresh perspective."
                      }
                    >
                      {query ||
                      category !== "All stories" ||
                      status !== "all" ? (
                        <button
                          className="primary"
                          onClick={() => {
                            setQuery("");
                            setCategory("All stories");
                            setStatus("all");
                          }}
                        >
                          Clear filters
                        </button>
                      ) : (
                        <a
                          className="primary"
                          href={view === "manage" ? "/write" : "/"}
                        >
                          {view === "manage"
                            ? "Write your first story"
                            : "Explore stories"}
                        </a>
                      )}
                    </Empty>
                  )}
                </section>
              </>
            )}
          </>
        )}
        {view === "explore" && (
          <section className="write-invitation">
            <div>
              <div className="eyebrow">SOMETHING ON YOUR MIND?</div>
              <h2>
                Make a little room
                <br />
                for <em>your ideas.</em>
              </h2>
            </div>
            <a className="primary" href="/write">
              <PenLine size={19} />
              Write your next story
            </a>
            <span className="invitation-mark" aria-hidden="true">
              ✳
            </span>
          </section>
        )}
        <footer>
          <a className="brand" href="/">
            marginly<span aria-hidden="true">✳</span>
          </a>
          <span>A little perspective goes a long way.</span>
          <span>© 2026 Marginly</span>
        </footer>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <dialog
        ref={dialog}
        className="confirm-dialog"
        onCancel={() => setDeleting(null)}
      >
        <h2>Delete this story?</h2>
        <p>“{deleting?.title}” and its comments will be permanently removed.</p>
        <div>
          <button
            className="secondary"
            disabled={busy.length > 0}
            onClick={() => setDeleting(null)}
          >
            Keep story
          </button>
          <button
            className="danger"
            disabled={busy.length > 0}
            onClick={remove}
          >
            {busy.length ? "Deleting…" : "Delete story"}
          </button>
        </div>
      </dialog>
    </>
  );
}
export function Cover({ post }: { post: Post }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [post.image]);
  return (
    <div className={`cover cover-${post.category.toLowerCase()}`}>
      {post.image && !failed ? (
        <img
          src={post.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <BookOpen size={48} />
      )}
    </div>
  );
}
export function Byline({ post }: { post: Post }) {
  return (
    <div className="byline">
      <span className={`avatar avatar-${post.author.charCodeAt(0) % 4}`}>
        {post.author
          .split(" ")
          .map((x) => x[0])
          .slice(0, 2)
          .join("")}
      </span>
      <div>
        <strong>{post.author}</strong>
        <span>{formatDate(post.createdAt)}</span>
      </div>
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Opening the journal…
    </div>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <BookOpen size={30} />
      <h2>{title}</h2>
      <p>{description}</p>
      {children || (
        <a className="primary" href="/">
          Explore stories
        </a>
      )}
    </div>
  );
}
export function Unavailable({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="empty" role="alert">
      <h2>We couldn't open the library</h2>
      <p>{error}</p>
      <button className="primary" onClick={retry}>
        Try again
      </button>
    </div>
  );
}
export function SignIn({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty title={title} description={description}>
      <a
        className="primary"
        href={`/signin-with-chatgpt?return_to=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "/")}`}
        target="_top"
      >
        Sign in with ChatGPT
      </a>
    </Empty>
  );
}
