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
      gradient: "from-blue-500/10 via-blue-600/15 to-blue-700/20",
      bgColor: "bg-blue-500",
      textColor: "text-blue-600",
      borderColor: "border-blue-200 dark:border-blue-800",
      buttonBg: "bg-blue-500 hover:bg-blue-600",
    },
    "short-break": {
      label: "Short Break",
      icon: Coffee,
      gradient: "from-green-500/10 via-green-600/15 to-green-700/20",
      bgColor: "bg-green-500",
      textColor: "text-green-600",
      borderColor: "border-green-200 dark:border-green-800",
      buttonBg: "bg-green-500 hover:bg-green-600",
    },
    "long-break": {
      label: "Long Break",
      icon: Timer,
      gradient: "from-orange-500/10 via-orange-600/15 to-orange-700/20",
      bgColor: "bg-orange-500",
      textColor: "text-orange-600",
      borderColor: "border-orange-200 dark:border-orange-800",
      buttonBg: "bg-orange-500 hover:bg-orange-600",
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
          className={`absolute inset-0 bg-gradient-to-br ${currentConfig.gradient} blur-3xl opacity-60 rounded-3xl`}
        ></div>

        <div
          className={`relative rounded-3xl border-2 ${currentConfig.borderColor} bg-white/80 dark:bg-gray-900/80 backdrop-blur-md p-8 transition-all duration-500 shadow-xl hover:shadow-2xl`}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-b from-purple-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-t from-blue-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2"></div>

          {/* Main content */}
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Timer Display */}
              <div className="flex items-center gap-6">
                <motion.div
                  className={`p-4 rounded-2xl bg-white dark:bg-gray-800 border-2 ${currentConfig.borderColor} shadow-lg relative overflow-hidden group`}
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
                    className={`text-lg font-semibold ${currentConfig.textColor} mb-2`}
                  >
                    {currentConfig.label}
                  </h3>
                  <motion.div
                    className="text-5xl lg:text-6xl font-bold font-mono text-gray-900 dark:text-gray-100"
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
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  <motion.div
                    className={`h-4 rounded-full ${currentConfig.bgColor} shadow-sm relative overflow-hidden`}
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent"></div>
                  </motion.div>
                </div>
                <div className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Session {completedSessions + 1} • {Math.round(progress)}%
                  Complete
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-3">
                  <Button
                    onClick={toggleTimer}
                    size="lg"
                    className={`${currentConfig.buttonBg} text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-full px-6`}
                  >
                    {isActive ? (
                      <Pause className="w-5 h-5 mr-2" />
                    ) : (
                      <Play className="w-5 h-5 mr-2" />
                    )}
                    {isActive ? "Pause" : "Start"}
                  </Button>
                  <Button
                    onClick={resetTimer}
                    variant="outline"
                    size="lg"
                    className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </Button>
                  <Button
                    onClick={() => setIsDialogOpen(true)}
                    variant="outline"
                    size="lg"
                    className="border-2 hover:bg-gray-100 dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 rounded-full px-4"
                  >
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>

                {/* Mode Switcher */}
                <div className="flex gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-xl shadow-inner">
                  {(
                    Object.keys(modeConfig) as Array<keyof typeof modeConfig>
                  ).map((timerMode) => (
                    <Button
                      key={timerMode}
                      onClick={() => switchMode(timerMode)}
                      variant={currentMode === timerMode ? "default" : "ghost"}
                      size="sm"
                      className={`text-xs px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        currentMode === timerMode
                          ? `${modeConfig[timerMode].buttonBg} text-white shadow-md`
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-700"
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
