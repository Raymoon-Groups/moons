import {
  MAX_MESSAGE_ATTACHMENT_BYTES,
  MAX_MESSAGE_ATTACHMENT_LABEL,
  MESSAGE_ATTACHMENT_MIME_TYPES,
  isMessageAttachmentTooLarge,
  messageAttachmentTooLargeMessage,
} from '@moons/shared';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ensurePhotoLibraryAccess, iosCompatibleAssetOptions } from '@/lib/image-picker-access';
import type { MessageAttachment } from '@/lib/messages';

export {
  MAX_MESSAGE_ATTACHMENT_BYTES,
  MAX_MESSAGE_ATTACHMENT_LABEL,
  MESSAGE_ATTACHMENT_MIME_TYPES,
};

export type AttachmentPickError = {
  title: string;
  message: string;
};

function validateSize(size: number | undefined): AttachmentPickError | null {
  if (size != null && isMessageAttachmentTooLarge(size)) {
    return {
      title: 'File too large',
      message: messageAttachmentTooLargeMessage(),
    };
  }
  return null;
}

function toAttachment(
  uri: string,
  name: string,
  mimeType: string | null | undefined,
  size: number | undefined,
): { file: MessageAttachment } | { error: AttachmentPickError } {
  const sizeError = validateSize(size);
  if (sizeError) return { error: sizeError };
  return {
    file: {
      uri,
      name: name || 'attachment',
      mimeType: mimeType ?? 'application/octet-stream',
    },
  };
}

export async function pickMessageDocument(): Promise<
  { file: MessageAttachment } | { error: AttachmentPickError } | null
> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: [...MESSAGE_ATTACHMENT_MIME_TYPES],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    return toAttachment(asset.uri, asset.name, asset.mimeType ?? null, asset.size);
  } catch {
    return {
      error: {
        title: 'Could not attach file',
        message: 'Something went wrong while selecting your document. Please try again.',
      },
    };
  }
}

export async function pickMessageImage(): Promise<
  { file: MessageAttachment } | { error: AttachmentPickError } | null
> {
  try {
    const access = await ensurePhotoLibraryAccess();
    if (!access.ok) {
      return {
        error: {
          title: 'Photo access needed',
          message: access.message,
        },
      };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      ...iosCompatibleAssetOptions(),
    });
    if (result.canceled || !result.assets[0]) return null;
    const asset = result.assets[0];
    const name = asset.fileName ?? `photo-${Date.now()}.jpg`;
    const mimeType = asset.mimeType ?? 'image/jpeg';
    return toAttachment(asset.uri, name, mimeType, asset.fileSize);
  } catch {
    return {
      error: {
        title: 'Could not attach photo',
        message: 'Something went wrong while selecting your image. Please try again.',
      },
    };
  }
}
