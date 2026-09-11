/** Keep in sync with packages/shared/src/post-media.ts */

export const MAX_POST_IMAGE_BYTES = 30 * 1024 * 1024;
export const MAX_POST_VIDEO_BYTES = 250 * 1024 * 1024;
export const MAX_POST_IMAGES = 10;
export const MAX_POST_VIDEOS = 1;

export const MAX_POST_IMAGE_LABEL = '30 MB';
export const MAX_POST_VIDEO_LABEL = '250 MB';

export const POST_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
] as const;

export const POST_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
] as const;

export function postImageTooLargeMessage() {
  return `Each image must be ${MAX_POST_IMAGE_LABEL} or smaller`;
}

export function postVideoTooLargeMessage() {
  return `Video must be ${MAX_POST_VIDEO_LABEL} or smaller`;
}

export function postMediaTooLargeMessage() {
  return `File is too large. Images up to ${MAX_POST_IMAGE_LABEL}, videos up to ${MAX_POST_VIDEO_LABEL}.`;
}
