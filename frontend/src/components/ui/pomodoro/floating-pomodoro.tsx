"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { PomodoroDialog } from "@/components/ui/pomodoro/pomodoro-dialog";

export function FloatingPomodoro() {
  const {
    currentMode,
    timeLeft,
    isActive,
    completedSessions,
    settings,
    toggleTimer,
    resetTimer,
    switchMode,
    updateSettings,
    isDialogOpen,
    setIsDialogOpen,
    formatTime,
    getProgress,
  } = usePomodoro();

  const [isExpanded, setIsExpanded] = useState(false);

  const getDurationForCurrentMode = () => {
    switch (currentMode) {
      case "focus":
        return settings.focusDuration * 60;
      case "short-break":
        return settings.shortBreakDuration * 60;
      case "long-break":
        return settings.longBreakDuration * 60;
    }
  };

  // Only show floating timer when there's an active session or time has been started
  const shouldShow = isActive || timeLeft < getDurationForCurrentMode();

  const getModeConfig = () => {
    switch (currentMode) {
      case "focus":
        return {
          color: "from-blue-500/20 to-blue-600/30",
          bgColor: "bg-blue-500",
          textColor: "text-blue-500",
          borderColor: "border-blue-500/30",
        };
      case "short-break":
        return {
          color: "from-green-500/20 to-green-600/30",
          bgColor: "bg-green-500",
          textColor: "text-green-500",
          borderColor: "border-green-500/30",
        };
      case "long-break":
        return {
          color: "from-orange-500/20 to-orange-600/30",
          bgColor: "bg-orange-500",
          textColor: "text-orange-500",
          borderColor: "border-orange-500/30",
        };
    }
  };

  const progress = getProgress();
  const modeConfig = getModeConfig();

  if (!shouldShow) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ opacity: 0, scale: 0.8, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 100 }}
          transition={{
            duration: 0.3,
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          <div className="relative">
            {/* Enhanced background gradient blur */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${modeConfig.color} blur-xl opacity-60 rounded-2xl`}
            ></div>

            <motion.div
              className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
              animate={{
                width: isExpanded ? 320 : 200,
                height: isExpanded ? 300 : 80,
              }}
              transition={{
                duration: 0.3,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              {/* Enhanced progress bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                <motion.div
                  className={`h-full ${modeConfig.bgColor} shadow-sm`}
                  style={{ width: `${progress}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              {/* Compact view */}
              {!isExpanded && (
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${modeConfig.bgColor} ${
                        isActive ? "animate-pulse" : ""
                      } shadow-sm`}
                    />
                    <span className="font-mono font-bold text-lg text-gray-900 dark:text-gray-100">
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={toggleTimer}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      {isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsExpanded(true)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Expanded view */}
              {isExpanded && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${modeConfig.textColor}`}>
                      {currentMode === "focus"
                        ? "Focus Time"
                        : currentMode === "short-break"
                        ? "Short Break"
                        : "Long Break"}
                    </h3>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsExpanded(false)}
                      className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold mb-2 text-gray-900 dark:text-gray-100">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Session {completedSessions + 1} • {Math.round(progress)}%
                      Complete
                    </div>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      variant={currentMode === "focus" ? "default" : "outline"}
                      size="sm"
                      onClick={() => switchMode("focus")}
                      className={`text-xs ${
                        currentMode === "focus"
                          ? "bg-blue-500 hover:bg-blue-600 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      Focus
                    </Button>
                    <Button
                      variant={
                        currentMode === "short-break" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => switchMode("short-break")}
                      className={`text-xs ${
                        currentMode === "short-break"
                          ? "bg-green-500 hover:bg-green-600 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      Short
                    </Button>
                    <Button
                      variant={
                        currentMode === "long-break" ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => switchMode("long-break")}
                      className={`text-xs ${
                        currentMode === "long-break"
                          ? "bg-orange-500 hover:bg-orange-600 text-white"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      Long
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={toggleTimer}
                      size="sm"
                      className={`${modeConfig.bgColor} hover:opacity-90 text-white shadow-md`}
                    >
                      {isActive ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={resetTimer}
                      variant="outline"
                      size="sm"
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <PomodoroDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        settings={settings}
        onSettingsChange={updateSettings}
        currentMode={currentMode}
        onModeChange={switchMode}
        isActive={isActive}
        onToggleTimer={toggleTimer}
        onResetTimer={resetTimer}
        timeLeft={timeLeft}
        completedSessions={completedSessions}
      />
    </>
  );
}
