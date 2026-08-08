/** Keep in sync with packages/shared/src/message-attachments.ts */
export const MAX_MESSAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_MESSAGE_ATTACHMENT_LABEL = '10 MB';

export const ALLOWED_MESSAGE_ATTACHMENT_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
]);

export function messageAttachmentTooLargeMessage() {
  return `Attachment must be ${MAX_MESSAGE_ATTACHMENT_LABEL} or smaller`;
}
