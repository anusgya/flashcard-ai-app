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
import { Separator } from "@/components/ui/separator";

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
      icon: "🧠",
      gradient: "from-blue-900/20 via-green-900/20 to-orange-900/20",
      bgColor: "bg-primary-orange",
      textColor: "text-primary-orange",
      borderColor:
        "border-primary-orange-secondary dark:border-primary-orange/30",
      buttonBg: "bg-primary-orange hover:border-0",
      accentColor: "bg-orange-500/10",
    },
    "short-break": {
      label: "Short Break",
      icon: "☕️",
      gradient: "from-blue-900/20 via-green-900/20 to-orange-900/20",
      bgColor: "bg-primary-green",
      textColor: "text-primary-green",
      borderColor: "border-divider dark:border-primary-green/30",
      buttonBg: "bg-primary-green hover:border-0",
      accentColor: "bg-green-500/10",
    },
    "long-break": {
      label: "Long Break",
      icon: "⏲️",
      gradient: "from-blue-900/20 via-green-900/20 to-orange-900/20",
      bgColor: "bg-primary-blue",
      textColor: "text-primary-blue",
      borderColor: "border-primary-blue-secondary",
      buttonBg: "bg-primary-blue hover:border-0",
      accentColor: "bg-blue-500/10",
    },
  };

  const progress = getProgress();
  const currentConfig = modeConfig[currentMode];

  return (
    <>
      <motion.div
        className="w-full relative overflow-hidden rounded-3xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Enhanced background gradient - from leaderboard */}
        <div
          className={`absolute inset-0 bg-gradient-to-r ${currentConfig.gradient} blur-xl opacity-50`}
        ></div>

        <div
          className={`relative rounded-3xl border-[1.5px] border-border bg-background/80 backdrop-blur-md py-3 px-8 transition-all duration-500 shadow-lg hover:shadow-xl`}
        >
          {/* Decorative elements - from leaderboard */}
          <div
            className={`absolute top-0 right-0 w-40 h-40 ${currentConfig.accentColor} rounded-3xl -translate-y-1/2 translate-x-1/2`}
          ></div>
          <div
            className={`absolute bottom-0 left-0 w-32 h-32 ${currentConfig.accentColor} rounded-3xl translate-y-1/2 -translate-x-1/2`}
          ></div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Timer Display */}
              <div className="flex items-center gap-6">
                <motion.div
                  className={`px-4 py-3 rounded-2xl ${currentConfig.bgColor} border-2 border-divider shadow-lg relative overflow-hidden group`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="text-3xl relative z-10">
                    {currentConfig.icon}
                  </span>
                </motion.div>

                <div className="text-center lg:text-left">
                  <h3
                    className={`font-semibold ${currentConfig.textColor} mb-2`}
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

              <Separator
                orientation="vertical"
                className="h-32 mx-4 bg-border"
              />

              {/* Circular Progress Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-36 h-36">
                  {/* Background circle */}
                  <svg
                    className="w-36 h-36 transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="7"
                      fill="none"
                      className="text-muted-foreground opacity-40"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="7"
                      fill="none"
                      strokeLinecap="round"
                      className={currentConfig.textColor}
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - progress / 100)
                      }`}
                      style={{
                        transition: "stroke-dashoffset 0.5s ease-out",
                      }}
                    />
                  </svg>

                  {/* Center content - Session number */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className={`text-3xl font-bold font-fragment-mono ${currentConfig.textColor}`}
                    >
                      {completedSessions + 1}
                    </div>
                    <div className="text-xs mt-2 text-secondary-foreground">
                      Session
                    </div>
                  </div>
                </div>
              </div>

              <Separator
                orientation="vertical"
                className="h-32 mx-4 bg-border"
              />

              {/* Controls */}
              <div className="flex flex-col items-center gap-6">
                {/* Mode Switcher */}
                <div className="flex gap-2 bg-secondary border border-divider rounded-full shadow-inner">
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
                <div className="flex gap-3">
                  <Button
                    onClick={toggleTimer}
                    variant="ghost"
                    className="text-muted gap-1 font-bold rounded-full hover:bg-muted-foreground transition-all duration-200 text-primary border-0  w-16 h-16 p-0"
                  >
                    {isActive ? (
                      <Pause className="w-16 h-16" />
                    ) : (
                      <Play className="w-16 h-16" />
                    )}
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="ghost"
                    className="hover:bg-muted-foreground rounded-full w-16 h-16 shadow-none transition-all duration-200 border-0 p-0"
                  >
                    <RotateCcw className="w-16 h-16" />
                  </Button>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="ghost"
                    className="hover:bg-muted-foreground rounded-full w-16 h-16 shadow-none transition-all duration-200 border-0 p-0"
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
