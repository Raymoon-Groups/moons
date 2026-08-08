/** Chat attachment limits — keep API `messages.service` / controller in sync. */

export const MAX_MESSAGE_ATTACHMENT_BYTES = 10 * 1024 * 1024;

export const MAX_MESSAGE_ATTACHMENT_LABEL = '10 MB';

export const MESSAGE_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
] as const;

export const MESSAGE_ATTACHMENT_ACCEPT =
  '.pdf,.doc,.docx,.txt,image/jpeg,image/png,image/gif,image/webp';

export function isMessageAttachmentTooLarge(sizeBytes: number) {
  return sizeBytes > MAX_MESSAGE_ATTACHMENT_BYTES;
}

export function messageAttachmentTooLargeMessage() {
  return `Attachments must be ${MAX_MESSAGE_ATTACHMENT_LABEL} or smaller. Choose a smaller file.`;
}
