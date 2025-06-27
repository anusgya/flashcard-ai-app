"use client";

import { useState, useRef, useEffect } from "react";
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
  const [hasMounted, setHasMounted] = useState(false);
  const constraintsRef = useRef(null);

  // Manual Drag Logic
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    if (nodeRef.current) {
      startPos.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - startPos.current.x,
        y: e.clientY - startPos.current.y,
      });
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    setIsDragging(false);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);
  // End Manual Drag Logic

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
          color: "",
          bgColor: "bg-primary-orange",
          textColor: "text-primary-orange",
          borderColor: "border-primary-orange/30",
        };
      case "short-break":
        return {
          // color: "from-primary-green/20 to-primary-green-secondary/30",
          bgColor: "bg-primary-green",
          textColor: "text-primary-green",
          borderColor: "border-primary-green/30",
        };
      case "long-break":
        return {
          // color: "from-primary-blue/20 to-primary-blue-secondary/30",
          bgColor: "bg-primary-blue",
          textColor: "text-primary-blue",
          borderColor: "border-primary-blue/30",
        };
    }
  };

  const progress = getProgress();
  const modeConfig = getModeConfig();

  if (!hasMounted) {
    return null;
  }

  return (
    <>
      <div ref={constraintsRef} className="fixed inset-0 pointer-events-none" />
      <motion.div
        ref={nodeRef}
        onPointerDown={handlePointerDown}
        className="fixed bottom-6 right-6 z-50 cursor-grab"
        style={{
          display: shouldShow ? "block" : "none",
        }}
        initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
        animate={{
          opacity: 1,
          scale: 1,
          x: position.x,
          y: position.y,
        }}
        transition={{
          opacity: { type: "spring", stiffness: 300, damping: 30 },
          scale: { type: "spring", stiffness: 300, damping: 30 },
          x: { type: "just" },
          y: { type: "just" },
        }}
        whileTap={{ cursor: "grabbing" }}
      >
        <div className="relative">
          {/* Enhanced background gradient blur */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${modeConfig.color} blur-xl opacity-60 rounded-2xl`}
          ></div>

          <motion.div
            className="relative bg-background backdrop-blur-md border border-border border-dotted rounded-2xl  overflow-hidden"
            animate={{
              width: isExpanded ? 320 : 150,
              height: isExpanded ? 300 : 60,
            }}
            transition={{
              duration: 0.3,
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            {/* Enhanced progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-muted dark:bg-gray-700">
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
                  <span className="font-mono font-bold text-lg text-secondary-foreground">
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={toggleTimer}
                    className="h-8 w-8 p-0 hover:bg-secondary rounded-full"
                  >
                    {isActive ? (
                      <Pause className="h-4 w-4 text-secondary-foreground" />
                    ) : (
                      <Play className="h-4 w-4 text-secondary-foreground" />
                    )}
                  </Button>
                  {/* <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsExpanded(true)}
                      className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button> */}
                </div>
              </div>
            )}

            {/* Expanded view */}
            {/* {isExpanded && (
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
                      className="h-8 w-8 p-0 hover:bg-muted rounded-full"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-mono font-bold mb-2 text-secondary-foreground">
                      {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-secondary-foreground">
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
                          ? "bg-primary-orange hover:bg-primary-orange-secondary text-foreground"
                          : "hover:bg-muted"
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
                          ? "bg-primary-green hover:bg-primary-green-secondary text-foreground"
                          : "hover:bg-muted"
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
                          ? "bg-primary-blue hover:bg-primary-blue-secondary text-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      Long
                    </Button>
                  </div>

                  <div className="flex justify-center gap-2">
                    <Button
                      onClick={toggleTimer}
                      size="sm"
                      className={`${modeConfig.bgColor} hover:opacity-90 text-foreground shadow-md`}
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
                      className="hover:bg-muted"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(true)}
                      variant="outline"
                      size="sm"
                      className="hover:bg-muted"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )} */}
          </motion.div>
        </div>
      </motion.div>

      <PomodoroDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        settings={settings}
        onSettingsChange={updateSettings}
      />
    </>
  );
}
