export const categories = [
  "All stories",
  "Design",
  "Technology",
  "Culture",
  "Travel",
  "Creativity",
] as const;
export type Category = Exclude<(typeof categories)[number], "All stories">;
export type Post = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: Category;
  author: string;
  owner: string;
  image: string;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  featured: number;
  likes: number;
  liked: boolean;
  bookmarked: boolean;
  commentCount: number;
};
export type Comment = {
  id: string;
  author: string;
  content: string;
  createdAt: string;
};
export type Viewer = { userId: string; displayName: string } | null;
export function readingTime(content: string) {
  return Math.max(1, Math.ceil(content.trim().split(/\s+/).length / 200));
}
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
