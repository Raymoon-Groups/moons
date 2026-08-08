import { Linking, Platform, Share } from 'react-native';
import type { FeedPost } from '@moons/shared';
import { API_ORIGIN } from '@/lib/config';

export function postWebBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_WEB_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (/localhost|127\.0\.0\.1|192\.168\.|10\.0\.2\.2/.test(API_ORIGIN)) {
    return 'http://localhost:3000';
  }
  return 'https://moonsjob.com';
}

export function postShareUrl(postId: string) {
  return `${postWebBaseUrl()}/dashboard?post=${postId}`;
}

export function postSharePreview(post: FeedPost) {
  const author = post.author.fullName?.trim() || 'a MoonsJob member';
  const preview = post.body.trim()
    ? post.body.trim().slice(0, 160)
    : post.media.length
      ? 'Shared a photo/video on MoonsJob'
      : 'Shared a post on MoonsJob';
  const url = postShareUrl(post.id);
  return {
    author,
    preview,
    url,
    title: `Post by ${author} on MoonsJob`,
    message: `${preview}\n\n${url}`,
  };
}

export async function sharePostNative(post: FeedPost) {
  const { title, message, url } = postSharePreview(post);
  await Share.share(
    Platform.OS === 'ios' ? { title, message, url } : { title, message },
  );
}

export async function sharePostWhatsApp(post: FeedPost) {
  const { message } = postSharePreview(post);
  const encoded = encodeURIComponent(message);
  const appUrl = `whatsapp://send?text=${encoded}`;
  const webUrl = `https://wa.me/?text=${encoded}`;
  try {
    const canOpen = await Linking.canOpenURL(appUrl);
    if (canOpen) {
      await Linking.openURL(appUrl);
      return;
    }
  } catch {
    // Fall through to web link
  }
  await Linking.openURL(webUrl);
}
