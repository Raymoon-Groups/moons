import type { FeedPost, PostCommentItem } from '@moons/shared';
import { authDelete, authFetch, authUpload, authUploadWithProgress } from '@/lib/api';
import { prepareUploadFile } from '@/lib/upload-file';

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

export type LocalMediaFile = {
  uri: string;
  name: string;
  mimeType: string;
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

export async function createPost(
  body: string,
  files: LocalMediaFile[],
  onProgress?: (progress: number) => void,
) {
  onProgress?.(0);
  const form = new FormData();
  if (body.trim()) form.append('body', body.trim());
  for (const file of files) {
    const uploadable = await prepareUploadFile(file);
    form.append('media', uploadable as unknown as Blob);
  }
  return authUploadWithProgress<FeedPost>('/posts', form, onProgress);
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
  return authFetch<{
    items: Array<import('@moons/shared').PostAuthor & { likedAt: string }>;
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  }>(`/posts/${postId}/likes?page=${page}&limit=50`);
}

export function fetchComments(postId: string, page = 1) {
  return authFetch<CommentsPage>(`/posts/${postId}/comments?page=${page}&limit=50`);
}

export async function addComment(postId: string, body: string, attachment?: LocalMediaFile) {
  if (attachment) {
    const form = new FormData();
    if (body.trim()) form.append('body', body.trim());
    const uploadable = await prepareUploadFile(attachment);
    form.append('attachment', uploadable as unknown as Blob);
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

export function hideComment(postId: string, commentId: string) {
  return authFetch<PostCommentItem>(`/posts/${postId}/comments/${commentId}/hide`, {
    method: 'POST',
  });
}

export function unhideComment(postId: string, commentId: string) {
  return authFetch<PostCommentItem>(`/posts/${postId}/comments/${commentId}/unhide`, {
    method: 'POST',
  });
}

export function sharePost(postId: string, body?: string) {
  return authFetch<FeedPost>(`/posts/${postId}/share`, {
    method: 'POST',
    body: JSON.stringify({ body: body ?? '' }),
  });
}
