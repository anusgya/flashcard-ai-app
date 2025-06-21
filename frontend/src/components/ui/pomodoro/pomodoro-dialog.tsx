"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PomodoroSettings } from "@/hooks/use-pomodoro";

interface PomodoroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
}

export function PomodoroDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
}: PomodoroDialogProps) {
  const [localSettings, setLocalSettings] =
    useState<PomodoroSettings>(settings);

  // Update local settings when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSettingsChange(localSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] py-10 px-8">
        <DialogHeader>
          <DialogTitle>Pomodoro Settings</DialogTitle>
          <DialogDescription className="text-secondary-foreground font-fragment-mono">
            Configure your pomodoro timer preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-6">
            <div className="space-y-4">
              <Label>
                <div className="text-sm font-semibold">Focus Duration</div>
                <span className="font-fragment-mono text-secondary-foreground">
                  {localSettings.focusDuration} minutes
                </span>
              </Label>
              <Slider
                value={[localSettings.focusDuration]}
                min={5}
                max={60}
                step={5}
                onValueChange={(value) =>
                  setLocalSettings({
                    ...localSettings,
                    focusDuration: value[0],
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <Label>
                <div className="text-sm font-semibold">Short Break</div>
                <span className="font-fragment-mono text-secondary-foreground">
                  {localSettings.shortBreakDuration} minutes
                </span>
              </Label>
              <Slider
                value={[localSettings.shortBreakDuration]}
                min={1}
                max={15}
                step={1}
                onValueChange={(value) =>
                  setLocalSettings({
                    ...localSettings,
                    shortBreakDuration: value[0],
                  })
                }
              />
            </div>

            <div className="space-y-4">
              <Label>
                <div className="text-sm font-semibold">Long Break</div>
                <span className="font-fragment-mono text-secondary-foreground">
                  {localSettings.longBreakDuration} minutes
                </span>
              </Label>
              <Slider
                value={[localSettings.longBreakDuration]}
                min={5}
                max={30}
                step={5}
                onValueChange={(value) =>
                  setLocalSettings({
                    ...localSettings,
                    longBreakDuration: value[0],
                  })
                }
              />
            </div>
            <Separator orientation="horizontal" className="mt-16" />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-breaks">Auto-start breaks</Label>
                <Switch
                  id="auto-breaks"
                  checked={localSettings.autoStartBreaks}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      autoStartBreaks: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="auto-pomodoros">Auto-start pomodoros</Label>
                <Switch
                  id="auto-pomodoros"
                  checked={localSettings.autoStartPomodoros}
                  onCheckedChange={(checked) =>
                    setLocalSettings({
                      ...localSettings,
                      autoStartPomodoros: checked,
                    })
                  }
                />
              </div>
            </div>
            <Separator orientation="horizontal" className="mt-16" />

            <div className="space-y-2 pt-4">
              <Label>Alarm Sound</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={
                    localSettings.alarmSound === "bell" ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setLocalSettings({ ...localSettings, alarmSound: "bell" })
                  }
                  className={cn(
                    "text-xs",
                    localSettings.alarmSound === "bell" && "bg-primary-green"
                  )}
                >
                  Bell
                </Button>
                <Button
                  variant={
                    localSettings.alarmSound === "digital"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      alarmSound: "digital",
                    })
                  }
                  className={cn(
                    "text-xs",
                    localSettings.alarmSound === "digital" &&
                      "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  Digital
                </Button>
                <Button
                  variant={
                    localSettings.alarmSound === "gentle"
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    setLocalSettings({
                      ...localSettings,
                      alarmSound: "gentle",
                    })
                  }
                  className={cn(
                    "text-xs",
                    localSettings.alarmSound === "gentle" &&
                      "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  Gentle
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
