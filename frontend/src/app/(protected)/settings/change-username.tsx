"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import useMe, { updateUserProfile } from "@/hooks/api/use-me"

export function ChangeUsername() {
  const { user, mutate } = useMe()
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Call the API to update the username
      await updateUserProfile({
        username: username,
      })

      // Update the local state with the new data
      mutate()

      toast({
        title: "Success",
        description: "Username updated successfully",
      })

      setUsername("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update username. It may already be taken.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="text-secondary-foreground">New Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={user?.username || ""}
          className="w-full max-w-md"
        />
      </div>
      <Button type="submit" className="bg-primary-green hover:border-0 text-muted" disabled={isLoading}>
        {isLoading ? "Changing..." : "Change Username"}
      </Button>
    </form>
  )
}
