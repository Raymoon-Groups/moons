import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Prevents a white/instant-close release crash when a JS error hits during boot.
 * Shows a recoverable screen instead of killing the activity.
 */
export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      console.error('[AppErrorBoundary]', error, info.componentStack);
    }
  }

  private retry = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.body}>
          MoonsJob hit an unexpected error while starting. Try again — if it keeps happening,
          reinstall the app or update from Play Store.
        </Text>
        {__DEV__ ? <Text style={styles.dev}>{this.state.error.message}</Text> : null}
        <Pressable style={styles.btn} onPress={this.retry}>
          <Text style={styles.btnText}>Try again</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    backgroundColor: '#F3F7FC',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#14233f',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5b6b82',
    marginBottom: 20,
  },
  dev: {
    fontSize: 12,
    color: '#b42318',
    marginBottom: 16,
  },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: '#3F74CC',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
