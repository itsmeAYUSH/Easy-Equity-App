/** Vibration feedback for key moments. Silently does nothing on web or unsupported devices. */
import * as Haptics from "expo-haptics"
import { Platform } from "react-native"

const run = (fn: () => Promise<void>) => {
  if (Platform.OS !== "web") fn().catch(() => {})
}

export const haptics = {
  /** Switching a tab, chip or segment. */
  tick: () => run(() => Haptics.selectionAsync()),
  /** A tap that changes something, like starring a stock. */
  tap: () => run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Something was saved. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Something failed. */
  fail: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
