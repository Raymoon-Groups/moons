import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

/** iOS needs library permission; Android uses the system photo picker (no broad access). */
export async function ensurePhotoLibraryAccess(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  if (Platform.OS !== 'ios') {
    return { ok: true };
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return {
      ok: false,
      message: 'Photo library permission is required. Enable it in Settings.',
    };
  }

  return { ok: true };
}

/** iOS-only picker options for reliable JPEG uploads from the gallery. */
export function iosCompatibleAssetOptions():
  | Pick<
      ImagePicker.ImagePickerOptions,
      'preferredAssetRepresentationMode'
    >
  | Record<string, never> {
  if (Platform.OS !== 'ios') return {};
  return {
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  };
}
