"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { PomodoroSettings } from "@/hooks/use-pomodoro";

interface PomodoroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: PomodoroSettings;
  onSettingsChange: (settings: PomodoroSettings) => void;
  currentMode: "focus" | "short-break" | "long-break";
  onModeChange: (mode: "focus" | "short-break" | "long-break") => void;
  isActive: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  timeLeft: number;
  completedSessions: number;
}

export function PomodoroDialog({
  open,
  onOpenChange,
  settings,
  onSettingsChange,
  currentMode,
  onModeChange,
  isActive,
  onToggleTimer,
  onResetTimer,
  timeLeft,
  completedSessions,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getDuration = () => {
    switch (currentMode) {
      case "focus":
        return settings.focusDuration * 60;
      case "short-break":
        return settings.shortBreakDuration * 60;
      case "long-break":
        return settings.longBreakDuration * 60;
    }
  };

  const progress = ((getDuration() - timeLeft) / getDuration()) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pomodoro Timer</DialogTitle>
          <DialogDescription className="text-secondary-foreground">
            Manage your focus sessions and breaks
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="timer" className="mt-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="timer" className="space-y-6 py-4">
            <div className="flex justify-center gap-4">
              <Button
                variant={currentMode === "focus" ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange("focus")}
                className={cn(
                  "text-xs font-medium",
                  currentMode === "focus" && "bg-blue-500 hover:bg-blue-600"
                )}
              >
                Focus
              </Button>
              <Button
                variant={currentMode === "short-break" ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange("short-break")}
                className={cn(
                  "text-xs font-medium",
                  currentMode === "short-break" &&
                    "bg-green-500 hover:bg-green-600"
                )}
              >
                Short Break
              </Button>
              <Button
                variant={currentMode === "long-break" ? "default" : "outline"}
                size="sm"
                onClick={() => onModeChange("long-break")}
                className={cn(
                  "text-xs font-medium",
                  currentMode === "long-break" &&
                    "bg-orange-500 hover:bg-orange-600"
                )}
              >
                Long Break
              </Button>
            </div>

            <Progress
              value={progress}
              className={cn(
                "h-2",
                currentMode === "focus" && "bg-blue-100 [&>div]:bg-blue-500",
                currentMode === "short-break" &&
                  "bg-green-100 [&>div]:bg-green-500",
                currentMode === "long-break" &&
                  "bg-orange-100 [&>div]:bg-orange-500"
              )}
            />

            <div className="flex flex-col items-center gap-6">
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "text-5xl font-mono font-bold",
                    currentMode === "focus" && "text-blue-500",
                    currentMode === "short-break" && "text-green-500",
                    currentMode === "long-break" && "text-orange-500"
                  )}
                >
                  {formatTime(timeLeft)}
                </div>

                <div className="flex flex-col items-center gap-1 bg-muted/50 px-4 py-3 rounded-lg">
                  <span className="text-2xl font-semibold">
                    {completedSessions}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">
                    Sessions
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onToggleTimer}
                  className="rounded-full h-12 w-12"
                >
                  {isActive ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onResetTimer}
                  className="rounded-full h-12 w-12"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>
                  Focus Duration: {localSettings.focusDuration} minutes
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

              <div className="space-y-2">
                <Label>
                  Short Break: {localSettings.shortBreakDuration} minutes
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

              <div className="space-y-2">
                <Label>
                  Long Break: {localSettings.longBreakDuration} minutes
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

              <div className="space-y-4 pt-4">
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

              <div className="space-y-2 pt-4">
                <Label>Alarm Sound</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={
                      localSettings.alarmSound === "bell"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setLocalSettings({ ...localSettings, alarmSound: "bell" })
                    }
                    className={cn(
                      "text-xs",
                      localSettings.alarmSound === "bell" &&
                        "bg-green-500 hover:bg-green-600"
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
          </TabsContent>
        </Tabs>

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
