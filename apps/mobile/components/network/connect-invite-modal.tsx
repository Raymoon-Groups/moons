import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { sendConnectionRequest } from '@/lib/network';
import { notifyConnectionsRefresh } from '@/lib/connection-invites';
import { fontStyle } from '@/lib/font-style';
import { useTheme } from '@/lib/theme-context';
import { theme } from '@/lib/theme';

export function ConnectInviteModal({
  visible,
  userId,
  fullName,
  onClose,
  onSent,
}: {
  visible: boolean;
  userId: string;
  fullName: string;
  onClose: () => void;
  onSent: (connectionId: string) => void;
}) {
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSend() {
    setLoading(true);
    setError('');
    try {
      const result = await sendConnectionRequest(userId, message.trim() || undefined);
      notifyConnectionsRefresh();
      onSent(result.id);
      setMessage('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invite');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.heading }, fontStyle('bold')]}>
            Connect with {fullName}
          </Text>
          <Text style={{ color: colors.muted, marginBottom: 12, fontSize: 14 }}>
            Add a short note (optional)
          </Text>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Hi, I'd like to connect..."
            placeholderTextColor={colors.muted}
            multiline
            maxLength={500}
            style={[
              styles.input,
              {
                color: colors.heading,
                borderColor: colors.border,
                backgroundColor: colors.surface,
              },
            ]}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, { borderColor: colors.border }]}>
              <Text style={{ color: colors.heading, ...fontStyle('semibold') }}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={() => void handleSend()}
              disabled={loading}
              style={[styles.btn, { backgroundColor: colors.blue, borderColor: colors.blue }]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', ...fontStyle('semibold') }}>Send invite</Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
  },
  title: { fontSize: 18, marginBottom: 6 },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  error: { color: '#dc2626', marginTop: 8, fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
