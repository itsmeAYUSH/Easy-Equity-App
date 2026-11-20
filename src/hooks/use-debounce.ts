import { useEffect, useState } from "react"

/**
 * Returns `input` once it has stayed the same for `waitMs` — so a search box
 * queries the API when the user pauses, not on every keystroke.
 */
export function useDebounce<V>(input: V, waitMs = 300): V {
  const [settled, setSettled] = useState(input)
  useEffect(() => {
    const handle = setTimeout(setSettled, waitMs, input)
    return () => clearTimeout(handle)
  }, [input, waitMs])
  return settled
}
