import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Keyboard height using RN core APIs only — avoids react-native-keyboard-controller,
 * which has crashed Android release builds when mounted at app root / New Arch.
 *
 * With `android.softwareKeyboardLayoutMode: "resize"`, Android already shrinks the
 * window, so we only apply height on iOS (or when `force` is true for Modals).
 */
export function useKeyboardHeight(options?: { force?: boolean }) {
  const [height, setHeight] = useState(0);
  const force = options?.force === true;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = Keyboard.addListener(showEvent, (event) => {
      if (Platform.OS === 'android' && !force) {
        setHeight(0);
        return;
      }
      setHeight(event.endCoordinates?.height ?? 0);
    });
    const onHide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      onShow.remove();
      onHide.remove();
    };
  }, [force]);

  return height;
}
