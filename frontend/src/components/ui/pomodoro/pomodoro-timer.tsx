"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Timer,
  Settings,
} from "lucide-react";
import { usePomodoro } from "@/hooks/use-pomodoro";
import { PomodoroDialog } from "@/components/ui/pomodoro/pomodoro-dialog";

export function PomodoroTimer() {
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

  const modeConfig = {
    focus: {
      label: "Focus Time",
      icon: Brain,
      gradient:
        "from-primary-orange/10 via-primary-orange/15 to-primary-orange-secondary/20",
      bgColor: "bg-primary-orange",
      textColor: "text-primary-orange",
      borderColor:
        "border-primary-orange-secondary dark:border-primary-orange/30",
      buttonBg: "bg-primary-orange hover:border-0",
    },
    "short-break": {
      label: "Short Break",
      icon: Coffee,
      gradient:
        "from-primary-green/10 via-primary-green/15 to-primary-green-secondary/20",
      bgColor: "bg-primary-green",
      textColor: "text-primary-green",
      borderColor:
        "border-primary-green-secondary dark:border-primary-green/30",
      buttonBg: "bg-primary-green hover:border-0",
    },
    "long-break": {
      label: "Long Break",
      icon: Timer,
      gradient:
        "from-primary-blue/10 via-primary-blue/15 to-primary-blue-secondary/20",
      bgColor: "bg-primary-blue",
      textColor: "text-primary-blue",
      borderColor: "border-primary-blue-secondary",
      buttonBg: "bg-primary-blue hover:border-0",
    },
  };

  const progress = getProgress();
  const currentConfig = modeConfig[currentMode];
  const IconComponent = currentConfig.icon;

  return (
    <>
      <motion.div
        className="w-full relative overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Enhanced background gradient */}
        <div
          className={`absolute inset-0 bg-gradient-to-br  ${currentConfig.gradient} blur-3xl opacity-60 rounded-3xl`}
        ></div>

        <div
          className={`relative rounded-3xl border-2 border-dashed border-border bg-background backdrop-blur-md p-8 transition-all duration-500 shadow-xl hover:shadow-2xl`}
        >
          {/* Decorative elements */}
          <div
            className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-${currentConfig.textColor.replace(
              "text-",
              ""
            )}/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-t from-${currentConfig.textColor.replace(
              "text-",
              ""
            )}/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2`}
          ></div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Timer Display */}
              <div className="flex items-center gap-6">
                <motion.div
                  className={`p-4 rounded-2xl bg-background border-2 border-border shadow-lg relative overflow-hidden group`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <IconComponent
                    className={`w-8 h-8 ${currentConfig.textColor} relative z-10`}
                  />
                </motion.div>

                <div className="text-center lg:text-left">
                  <h3
                    className={`text-lg font-semibold font-fragment-mono ${currentConfig.textColor} mb-2`}
                  >
                    {currentConfig.label}
                  </h3>
                  <motion.div
                    className="text-5xl lg:text-6xl font-bold font-fragment-mono text-foreground"
                    key={timeLeft}
                    initial={{ scale: 1.05 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.1 }}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                </div>
              </div>

              {/* Progress Section */}
              <div className="flex-1 max-w-md w-full relative">
                <div className="w-full bg-card dark:bg-gray-700 rounded-full h-3 mb-4 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0"></div>
                  <motion.div
                    className={`h-3 rounded-full ${currentConfig.bgColor} shadow-sm relative overflow-hidden`}
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                  </motion.div>
                </div>
                <div className="text-center text-sm text-secondary-foreground font-medium">
                  Session {completedSessions + 1} • {Math.round(progress)}%
                  Complete
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-6">
                {/* Mode Switcher */}
                <div className="flex gap-2 p-2 bg-secondary rounded-full shadow-inner">
                  {(
                    Object.keys(modeConfig) as Array<keyof typeof modeConfig>
                  ).map((timerMode) => (
                    <Button
                      key={timerMode}
                      onClick={() => switchMode(timerMode)}
                      variant={currentMode === timerMode ? "default" : "ghost"}
                      size="sm"
                      className={`text-xs px-4 py-2 rounded-full font-medium transition-all duration-200 border-0 ${
                        currentMode === timerMode
                          ? `${modeConfig[timerMode].buttonBg} text-muted font-semibold`
                          : `text-secondary-foreground hover:text-foreground hover:bg-background dark:hover:bg-gray-700`
                      }`}
                    >
                      {timerMode === "focus"
                        ? "Focus"
                        : timerMode === "short-break"
                        ? "Short Break"
                        : "Long Break"}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-8">
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    variant="ghost"
                    className="text-muted gap-1 font-bold transition-all duration-200 text-primary border-0 p-0 hover:bg-transparent"
                  >
                    {isActive ? (
                      <Pause className="w-32 h-32" />
                    ) : (
                      <Play className="w-32 h-32" />
                    )}
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="ghost"
                    size="lg"
                    className="hover:bg-transparent shadow-none transition-all duration-200 border-0 p-0"
                  >
                    <RotateCcw className="w-16 h-16" />
                  </Button>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="ghost"
                    size="lg"
                    className="hover:bg-transparent shadow-none transition-all duration-200 border-0 p-0"
                  >
                    <Settings className="w-16 h-16" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
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
