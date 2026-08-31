import {
  MAX_MESSAGE_ATTACHMENT_BYTES,
  MAX_MESSAGE_ATTACHMENT_LABEL,
  MESSAGE_ATTACHMENT_MIME_TYPES,
  isMessageAttachmentTooLarge,
  messageAttachmentTooLargeMessage,
} from '@moons/shared';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
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
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return {
        error: {
          title: 'Photo access needed',
          message: 'Allow photo library access in Settings to attach images.',
        },
      };
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
      ...(Platform.OS === 'ios'
        ? {
            preferredAssetRepresentationMode:
              ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
          }
        : {}),
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
