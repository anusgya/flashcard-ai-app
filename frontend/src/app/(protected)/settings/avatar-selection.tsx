"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { updateUserProfile } from "@/hooks/api/use-me";// Import the updateUserProfile function
import { useToast } from "@/hooks/use-toast" // Import toast for notifications
import useMe from "@/hooks/api/use-me";

const AVATARS = [
  { id: "1", url: "/media/avatars/Ellipse1.png", fallback: "A1", name:"Ellipse1.png" },
  { id: "2", url: "/media/avatars/Ellipse2.png", fallback: "A2" , name:"Ellipse2.png"},
  { id: "3", url: "/media/avatars/Ellipse3.png", fallback: "A3" , name:"Ellipse3.png"},
  { id: "4", url: "/media/avatars/Ellipse4.png", fallback: "A4", name:"Ellipse4.png" },
  { id: "5", url: "/media/avatars/Ellipse5.png", fallback: "A5", name:"Ellipse5.png" },
  { id: "6", url: "/media/avatars/Ellipse6.png", fallback: "A6", name:"Ellipse6.png" },
  { id: "7", url: "/media/avatars/Ellipse7.png", fallback: "A6" , name:"Ellipse7.png"},
  { id: "8", url: "/media/avatars/Ellipse8.png", fallback: "A6", name:"Ellipse8.png" }
]

export function AvatarSelection() {
  const [selectedAvatar, setSelectedAvatar] = useState("1")
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { user, mutate } = useMe();

  const handleSaveChanges = async () => {
    try {
      setIsLoading(true)
      
      // Find the selected avatar object
      const selectedAvatarObj = AVATARS.find(avatar => avatar.id === selectedAvatar)
      
      if (!selectedAvatarObj) {
        throw new Error("Selected avatar not found")
      }
      
      // Send the avatar name to the API
      await updateUserProfile({
        avatar: selectedAvatarObj.name
      })
      mutate();
      
      toast({
        title: "Avatar updated",
        description: "Your profile avatar has been updated successfully.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating avatar:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your avatar. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageError = (id: string) => {
    setImageError((prev) => ({ ...prev, [id]: true }))
    console.error(`Failed to load image for avatar ${id}`)
  }

  return (
    <div className="space-y-4">
      <RadioGroup
        defaultValue="1"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-8 gap-4"
        onValueChange={setSelectedAvatar}
        value={selectedAvatar}
      >
        {AVATARS.map((avatar) => (
          <div key={avatar.id} className="flex flex-col items-center gap-2 cursor-pointer">
            <RadioGroupItem value={avatar.id} id={`avatar-${avatar.id}`} className="peer sr-only" />
            <Label
              htmlFor={`avatar-${avatar.id}`}
              className="flex flex-col items-center gap-2 rounded-full border-2  border-muted p-2 hover:border-primary cursor-pointer peer-data-[state=checked]:border-primary-green"
            >
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatar.url || "/placeholder.svg"}
                  alt={`Avatar ${avatar.id}`}
                  onError={() => handleImageError(avatar.id)}
                />
                <AvatarFallback>{avatar.fallback}</AvatarFallback>
              </Avatar>
              {/* <span className="text-sm">Avatar {avatar.id}</span> */}
            </Label>
          </div>
        ))}
      </RadioGroup>

      {Object.keys(imageError).length > 0 && (
        <div className="text-red-500 text-sm">
          Some avatar images failed to load. Make sure they exist in the public directory.
        </div>
      )}

      <Button
        variant={"default"}
        className="w-48 bg-primary-green text-muted font-semibold hover:border-0"
        onClick={handleSaveChanges}
        disabled={isLoading}
      >
        {isLoading ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  )
}
