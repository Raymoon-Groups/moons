import type { FeedPost, PostAuthor, PostCommentItem } from '@moons/shared';
import { authDelete, authFetch, authUpload } from '@/lib/api-client';

export type FeedPage = {
  items: FeedPost[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type CommentsPage = {
  items: PostCommentItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type LikesPage = {
  items: Array<PostAuthor & { likedAt: string }>;
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export function fetchFeed(page = 1, limit = 20) {
  return authFetch<FeedPage>(`/posts/feed?page=${page}&limit=${limit}`);
}

export function fetchUserPosts(userId: string, page = 1, limit = 20) {
  return authFetch<FeedPage>(`/posts/user/${userId}?page=${page}&limit=${limit}`);
}

export function fetchPost(postId: string) {
  return authFetch<FeedPost>(`/posts/${postId}`);
}

export function createPost(body: string, files: File[]) {
  const form = new FormData();
  if (body.trim()) form.append('body', body.trim());
  for (const file of files) {
    form.append('media', file);
  }
  return authUpload<FeedPost>('/posts', form);
}

export function deletePost(postId: string) {
  return authDelete<{ success: boolean }>(`/posts/${postId}`);
}

export function updatePost(postId: string, body: string) {
  return authFetch<FeedPost>(`/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({ body }),
  });
}

export function likePost(postId: string) {
  return authFetch<FeedPost>(`/posts/${postId}/like`, { method: 'POST' });
}

export function unlikePost(postId: string) {
  return authFetch<FeedPost>(`/posts/${postId}/like`, { method: 'DELETE' });
}

export function fetchLikes(postId: string, page = 1) {
  return authFetch<LikesPage>(`/posts/${postId}/likes?page=${page}&limit=50`);
}

export function fetchComments(postId: string, page = 1) {
  return authFetch<CommentsPage>(`/posts/${postId}/comments?page=${page}&limit=50`);
}

export function addComment(postId: string, body: string, attachment?: File) {
  if (attachment) {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    form.append('attachment', attachment);
    return authUpload<PostCommentItem>(`/posts/${postId}/comments`, form);
  }
  return authFetch<PostCommentItem>(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

export function deleteComment(postId: string, commentId: string) {
  return authDelete<{ success: boolean }>(`/posts/${postId}/comments/${commentId}`);
}

export function sharePost(postId: string, body?: string) {
  return authFetch<FeedPost>(`/posts/${postId}/share`, {
    method: 'POST',
    body: JSON.stringify({ body: body ?? '' }),
  });
}
