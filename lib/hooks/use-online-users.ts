"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { supabaseBrowser } from "@/lib/supabase/client"

const CHANNEL = "presence:online"

export function useOnlineUsers() {
  const { data: session } = useSession()
  const [online, setOnline] = useState<Set<string>>(new Set())

  useEffect(() => {
    const channel = supabaseBrowser.channel(CHANNEL, {
      config: { presence: { key: session?.user?.id ?? crypto.randomUUID() } },
    })

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ user_id: string }>()
      setOnline(new Set(Object.values(state).flat().map((p) => p.user_id)))
    })

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED" && session?.user?.id) {
        await channel.track({ user_id: session.user.id })
      }
    })

    return () => {
      channel.unsubscribe()
    }
  }, [session?.user?.id])

  return online
}

export function useIsOnline(userId: string | null | undefined) {
  const online = useOnlineUsers()
  return userId ? online.has(userId) : false
}
