/**
 * Key-value storage for EasyEquity.
 *
 * On a device build it uses MMKV: synchronous and memory-mapped, so reading
 * the saved sign-in, theme and cached news at launch costs almost nothing.
 * Where MMKV's native module isn't present (Expo Go, web) it uses AsyncStorage.
 *
 * The interface is Promise-based (getItem / setItem / removeItem), which is
 * what Supabase's session store and React Query's persister both expect.
 */
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Platform } from "react-native"

type SyncStore = {
  getString(key: string): string | undefined
  set(key: string, value: string): void
  remove(key: string): unknown
}

function openMmkv(): SyncStore | null {
  if (Platform.OS === "web") return null
  try {
    // Required lazily: the import itself throws where the native module is missing.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createMMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv")
    return createMMKV({ id: "easyequity" })
  } catch {
    return null
  }
}

const mmkv = openMmkv()

export const storage = {
  /** True on a device build (MMKV); false in Expo Go and on web. */
  fast: mmkv !== null,

  async getItem(key: string): Promise<string | null> {
    return mmkv ? (mmkv.getString(key) ?? null) : AsyncStorage.getItem(key)
  },
  async setItem(key: string, value: string): Promise<void> {
    if (mmkv) mmkv.set(key, value)
    else await AsyncStorage.setItem(key, value)
  },
  async removeItem(key: string): Promise<void> {
    if (mmkv) mmkv.remove(key)
    else await AsyncStorage.removeItem(key)
  },
}
