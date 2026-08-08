import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { SuccessModalVariant } from '@/components/success-modal';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ConnectionSuccessKind = 'sent' | 'accepted' | 'removed';

export type ConnectionSuccessPayload = {
  kind: ConnectionSuccessKind;
  fullName?: string | null;
};

type Listener = (payload: ConnectionSuccessPayload) => void;

const listeners = new Set<Listener>();

export function subscribeConnectionSuccess(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyInviteSent(fullName?: string | null) {
  listeners.forEach((listener) => listener({ kind: 'sent', fullName }));
}

export function notifyInviteAccepted(fullName?: string | null) {
  listeners.forEach((listener) => listener({ kind: 'accepted', fullName }));
}

export function notifyConnectionRemoved(fullName?: string | null) {
  listeners.forEach((listener) => listener({ kind: 'removed', fullName }));
}

export function connectionSuccessCopy(payload: ConnectionSuccessPayload): {
  title: string;
  message: string;
  secondaryLabel: string;
  variant: SuccessModalVariant;
  icon: IconName;
} {
  const name = payload.fullName?.trim();

  if (payload.kind === 'sent') {
    return {
      title: 'Invitation sent',
      message: name
        ? `Your connection invite to ${name} was sent successfully.`
        : 'Your connection invite was sent successfully.',
      secondaryLabel: 'View network',
      variant: 'success',
      icon: 'paper-plane-outline',
    };
  }

  if (payload.kind === 'removed') {
    return {
      title: 'Connection removed',
      message: name
        ? `${name} has been removed from your connections.`
        : 'This person has been removed from your connections.',
      secondaryLabel: 'View network',
      variant: 'neutral',
      icon: 'person-remove-outline',
    };
  }

  return {
    title: "You're connected",
    message: name
      ? `You and ${name} are now connected on MoonsJob.`
      : 'You are now connected on MoonsJob.',
    secondaryLabel: 'View network',
    variant: 'success',
    icon: 'people-outline',
  };
}
