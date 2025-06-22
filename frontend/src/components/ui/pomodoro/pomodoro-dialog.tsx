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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
              <Select
                value={localSettings.alarmSound}
                onValueChange={(value: "bell" | "digital" | "gentle") =>
                  setLocalSettings({ ...localSettings, alarmSound: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an alarm sound" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bell">Bell</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="gentle">Gentle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="ghost">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="ghost"
            className="text-primary-green hover:text-primary-green"
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
