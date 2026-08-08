import { router } from 'expo-router';
import { SuccessModal } from '@/components/success-modal';

export function ProfileSuccessModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <SuccessModal
      visible={visible}
      onClose={onClose}
      title="Profile updated"
      message="Your MoonsJob profile has been saved successfully."
      primaryLabel="Got it"
      secondaryLabel="Go to profile"
      onSecondary={() => router.replace('/(tabs)/profile')}
      variant="success"
      icon="person-outline"
    />
  );
}
