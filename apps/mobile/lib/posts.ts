import type { FeedPost, PostCommentItem } from '@moons/shared';
import { authDelete, authFetch, authUpload, authUploadWithProgress } from '@/lib/api';
import { appendUploadFile } from '@/lib/upload-file';

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
  size?: number;
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
  const form = new FormData();
  const trimmed = body.trim();
  if (trimmed) form.append('body', trimmed);

  if (files.length > 0) {
    onProgress?.(6);
    for (let i = 0; i < files.length; i += 1) {
      await appendUploadFile(form, 'media', files[i]);
      onProgress?.(Math.round(6 + ((i + 1) / files.length) * 10));
    }
    return authUploadWithProgress<FeedPost>('/posts', form, (p) => {
      // Keep preparing at 6-16, map upload into 16-96, leave room for finishing.
      onProgress?.(Math.min(96, Math.round(16 + (p / 100) * 80)));
    });
  }

  if (!trimmed) {
    throw new Error('Add text, an image, or a video to post');
  }

  onProgress?.(40);
  const result = await authUploadWithProgress<FeedPost>('/posts', form, (p) => {
    onProgress?.(Math.min(96, Math.max(40, Math.round(40 + (p / 100) * 56))));
  });
  return result;
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
    form.append('body', body.trim());
    await appendUploadFile(form, 'attachment', attachment);
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
