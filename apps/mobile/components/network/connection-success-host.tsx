import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SuccessModal } from '@/components/success-modal';
import {
  connectionSuccessCopy,
  subscribeConnectionSuccess,
  type ConnectionSuccessPayload,
} from '@/lib/connection-success-events';

export function ConnectionSuccessHost() {
  const [payload, setPayload] = useState<ConnectionSuccessPayload | null>(null);

  useEffect(() => {
    return subscribeConnectionSuccess((next) => {
      setPayload(next);
    });
  }, []);

  const copy = payload ? connectionSuccessCopy(payload) : null;

  return (
    <SuccessModal
      visible={Boolean(payload && copy)}
      onClose={() => setPayload(null)}
      title={copy?.title ?? 'Success'}
      message={copy?.message ?? ''}
      primaryLabel="Got it"
      secondaryLabel={copy?.secondaryLabel}
      onSecondary={() => router.push('/(tabs)/network' as never)}
      variant={copy?.variant ?? 'success'}
      icon={copy?.icon}
    />
  );
}
