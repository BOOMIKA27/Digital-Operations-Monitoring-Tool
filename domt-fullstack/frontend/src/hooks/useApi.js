import { useState, useEffect, useCallback } from 'react'

export function useApi(apiFn, deps = [], immediate = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const fetch = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFn(...args)
      setData(res.data)
      return res.data
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'An error occurred'
      setError(msg)
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (immediate) fetch()
  }, [fetch])

  return { data, loading, error, refetch: fetch }
}

export function usePolling(apiFn, interval = 5000, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await apiFn()
        if (!cancelled) setData(res.data)
      } catch {} finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    const id = setInterval(run, interval)
    return () => { cancelled = true; clearInterval(id) }
  }, deps)

  return { data, loading }
}
