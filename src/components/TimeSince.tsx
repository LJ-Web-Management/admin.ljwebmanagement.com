import { useEffect, useState } from 'react'

function formatElapsed(ms: number): string {
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ${minutes % 60}m`
  const days = Math.floor(hours / 24)
  return `${days}d ${hours % 24}h`
}

export function TimeSince({ date }: { date: string }) {
  const [, forceTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const elapsedMs = Date.now() - new Date(date).getTime()
  return <span title={new Date(date).toLocaleString()}>{formatElapsed(elapsedMs)} ago</span>
}
