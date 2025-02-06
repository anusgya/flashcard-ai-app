"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const AVATARS = [
  { id: "1", url: "/placeholder.svg?height=40&width=40", label: "Default" },
  {
    id: "2",
    url: "/placeholder.svg?height=40&width=40",
    label: "Professional",
  },
  { id: "3", url: "/placeholder.svg?height=40&width=40", label: "Casual" },
];

export function AvatarSelection() {
  return (
    <div className="space-y-4 ">
      <RadioGroup defaultValue="1" className="grid grid-cols-3 gap-4">
        {AVATARS.map((avatar) => (
          <div key={avatar.id} className="flex flex-col items-center gap-2">
            <RadioGroupItem
              value={avatar.id}
              id={`avatar-${avatar.id}`}
              className="peer sr-only"
            />
            <Label
              htmlFor={`avatar-${avatar.id}`}
              className="flex flex-col items-center gap-2 rounded-lg border-2 border-muted p-4 hover:b peer-data-[state=checked]:border-primary"
            >
              <Avatar className="h-12  w-12">
                <AvatarImage src={avatar.url} alt={avatar.label} />
                <AvatarFallback>{avatar.label[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm">{avatar.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      <Button
        variant={"default"}
        className="w-48 bg-primary-green text-muted font-semibold"
      >
        Save Changes
      </Button>
    </div>
  );
}
