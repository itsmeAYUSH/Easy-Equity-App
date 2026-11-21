import { useCallback, useEffect, useState } from "react"

import { storage } from "@/lib/storage"

const KEY = "easyequity.saved-compares.v1"
const MAX_SAVED = 12

export type SavedCompare = { name: string; symbols: string[] }

function parse(raw: string | null): SavedCompare[] {
  try {
    const list = JSON.parse(raw ?? "[]")
    return Array.isArray(list)
      ? list.filter((s): s is SavedCompare => typeof s?.name === "string" && Array.isArray(s?.symbols)).slice(0, MAX_SAVED)
      : []
  } catch {
    return []
  }
}

/** Named sets of stocks to compare, kept on this device (like the website's saved comparisons). */
export function useSavedCompares() {
  const [items, setItems] = useState<SavedCompare[]>([])

  useEffect(() => {
    let active = true
    storage
      .getItem(KEY)
      .then((raw) => active && setItems(parse(raw)))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const write = useCallback((next: SavedCompare[]) => {
    setItems(next)
    storage.setItem(KEY, JSON.stringify(next)).catch(() => {})
  }, [])

  const save = useCallback(
    (name: string, symbols: string[]) => {
      const clean = name.trim().slice(0, 40)
      if (!clean || !symbols.length) return
      write([{ name: clean, symbols }, ...items.filter((i) => i.name !== clean)].slice(0, MAX_SAVED))
    },
    [items, write],
  )
  const remove = useCallback((name: string) => write(items.filter((i) => i.name !== name)), [items, write])

  return { items, save, remove }
}
