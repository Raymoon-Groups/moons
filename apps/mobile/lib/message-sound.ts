import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import type { ConversationPreview, MessageItem } from '@/lib/messages';

const MESSAGE_SOUND = require('../assets/sounds/new-message.wav');

const lastMessageByConversation = new Map<string, string>();
let lastPlayedAt = 0;
let player: ReturnType<typeof createAudioPlayer> | null = null;
let preparing: Promise<void> | null = null;

async function prepareNativePlayer() {
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: false,
    interruptionMode: 'mixWithOthers',
  });
  if (!player) {
    player = createAudioPlayer(MESSAGE_SOUND);
  }
}

export async function prepareMessageSound() {
  if (preparing) return preparing;
  preparing = (async () => {
    try {
      await prepareNativePlayer();
    } catch {
      // Native module may be unavailable until the dev client reloads.
    }
  })();
  return preparing;
}

async function playWithHapticFallback() {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // ignore
  }
}

export async function playIncomingMessageSound() {
  const now = Date.now();
  if (now - lastPlayedAt < 900) return;
  lastPlayedAt = now;

  await prepareMessageSound();

  try {
    if (player) {
      player.seekTo(0);
      player.play();
      return;
    }
  } catch {
    // fall through to haptics
  }

  await playWithHapticFallback();
}

export function resetMessageSoundTracking() {
  lastMessageByConversation.clear();
}

export function setMessageSoundBaseline(conversations: ConversationPreview[]) {
  for (const conversation of conversations) {
    const latest = conversation.lastMessage;
    if (latest) {
      lastMessageByConversation.set(conversation.id, latest.id);
    }
  }
}

export function setThreadMessageBaseline(conversationId: string, messages: MessageItem[]) {
  const latest = messages[messages.length - 1];
  if (latest) {
    lastMessageByConversation.set(conversationId, latest.id);
  }
}

export function notifyPossibleIncomingMessage(
  conversationId: string,
  message: { id: string; isMine: boolean },
) {
  if (message.isMine) {
    lastMessageByConversation.set(conversationId, message.id);
    return;
  }

  const previousId = lastMessageByConversation.get(conversationId);
  if (previousId === message.id) return;

  lastMessageByConversation.set(conversationId, message.id);
  if (!previousId) return;

  void playIncomingMessageSound();
}

export function inspectInboxForIncomingMessages(conversations: ConversationPreview[]) {
  for (const conversation of conversations) {
    const latest = conversation.lastMessage;
    if (!latest) continue;
    notifyPossibleIncomingMessage(conversation.id, latest);
  }
}
