"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

export function DailyLimits() {
  return (
    <div className="space-y-6 max-w-sm">
      <div className="flex items-center justify-between">
        <Label htmlFor="notifications" className="flex flex-col gap-1">
          <span>Daily Reminders</span>
          <span className="font-normal text-sm text-secondary-foreground">
            Receive notifications for your daily goals
          </span>
        </Label>
        <Switch id="notifications" />
      </div>

      <div className="space-y-4">
        <Label className="flex flex-col gap-1">
          <span>Cards Per Day</span>
          <span className="font-normal text-sm text-secondary-foreground">
            Set your daily learning target
          </span>
        </Label>
        <Slider defaultValue={[50]} max={100} step={10} className="w-full" />
        <div className="text-sm text-secondary-foreground text-center">
          Target: 50 cards
        </div>
      </div>

      <Button className="w-48 bg-primary-green text-muted font-semibold">
        Save Preferences
      </Button>
    </div>
  );
}
