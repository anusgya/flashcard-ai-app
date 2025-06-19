"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export interface PomodoroSettings {
  focusDuration: number; // in minutes
  shortBreakDuration: number; // in minutes
  longBreakDuration: number; // in minutes
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  alarmSound: "bell" | "digital" | "gentle";
}

type TimerMode = "focus" | "short-break" | "long-break";

interface PomodoroContextType {
  // Timer state
  currentMode: TimerMode;
  timeLeft: number;
  isActive: boolean;
  completedSessions: number;

  // Settings
  settings: PomodoroSettings;

  // Actions
  toggleTimer: () => void;
  resetTimer: () => void;
  switchMode: (mode: TimerMode) => void;
  updateSettings: (settings: PomodoroSettings) => void;

  // Dialog state
  isDialogOpen: boolean;
  setIsDialogOpen: (open: boolean) => void;

  // Utility functions
  formatTime: (seconds: number) => string;
  getDuration: (mode?: TimerMode) => number;
  getProgress: () => number;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(
  undefined
);

const defaultSettings: PomodoroSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  alarmSound: "bell",
};

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [currentMode, setCurrentMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Load settings and state from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSettings = localStorage.getItem("pomodoro-settings");
      const savedState = localStorage.getItem("pomodoro-state");

      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
        } catch (error) {
          console.error("Failed to parse saved settings:", error);
        }
      }

      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState);
          setCurrentMode(parsedState.currentMode || "focus");
          setCompletedSessions(parsedState.completedSessions || 0);

          // Handle time restoration for active timers
          if (parsedState.isActive && parsedState.lastTick) {
            const timePassed = Math.floor(
              (Date.now() - parsedState.lastTick) / 1000
            );
            const newTimeLeft = Math.max(0, parsedState.timeLeft - timePassed);
            setTimeLeft(newTimeLeft);
            setIsActive(newTimeLeft > 0);
          } else {
            setTimeLeft(
              parsedState.timeLeft ||
                getDurationForMode(
                  parsedState.currentMode || "focus",
                  savedSettings ? JSON.parse(savedSettings) : defaultSettings
                ) * 60
            );
            setIsActive(false);
          }
        } catch (error) {
          console.error("Failed to parse saved state:", error);
        }
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      const state = {
        currentMode,
        timeLeft,
        completedSessions,
        isActive,
        lastTick: Date.now(),
      };
      localStorage.setItem("pomodoro-state", JSON.stringify(state));
    }
  }, [currentMode, timeLeft, completedSessions, isActive]);

  // Save settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("pomodoro-settings", JSON.stringify(settings));
    }
  }, [settings]);

  // Helper function to get duration for a mode
  const getDurationForMode = (
    mode: TimerMode,
    settingsObj: PomodoroSettings
  ) => {
    switch (mode) {
      case "focus":
        return settingsObj.focusDuration;
      case "short-break":
        return settingsObj.shortBreakDuration;
      case "long-break":
        return settingsObj.longBreakDuration;
    }
  };

  // Timer logic - this runs in the provider so it persists across navigation
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          lastTickRef.current = Date.now();
          return newTime;
        });
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Timer completed
      setIsActive(false);
      playAlarmSound();

      if (currentMode === "focus") {
        setCompletedSessions((prev) => prev + 1);
        // Auto switch to break
        const nextMode =
          completedSessions > 0 && (completedSessions + 1) % 4 === 0
            ? "long-break"
            : "short-break";

        if (settings.autoStartBreaks) {
          setCurrentMode(nextMode);
          setTimeLeft(getDurationForMode(nextMode, settings) * 60);
          setIsActive(true);
        } else {
          setCurrentMode(nextMode);
          setTimeLeft(getDurationForMode(nextMode, settings) * 60);
        }
      } else {
        // Break completed, switch to focus
        if (settings.autoStartPomodoros) {
          setCurrentMode("focus");
          setTimeLeft(settings.focusDuration * 60);
          setIsActive(true);
        } else {
          setCurrentMode("focus");
          setTimeLeft(settings.focusDuration * 60);
        }
      }
    } else {
      // Clear interval when not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, timeLeft, currentMode, completedSessions, settings]);

  const getDuration = (mode?: TimerMode) => {
    const targetMode = mode || currentMode;
    return getDurationForMode(targetMode, settings) * 60;
  };

  const playAlarmSound = () => {
    // Simple beep sound - you can replace with actual audio files
    if (typeof window !== "undefined" && window.AudioContext) {
      try {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value =
          settings.alarmSound === "bell"
            ? 800
            : settings.alarmSound === "digital"
            ? 1000
            : 600;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 1
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1);
      } catch (error) {
        console.error("Failed to play alarm sound:", error);
      }
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
    lastTickRef.current = Date.now();
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(getDuration());
  };

  const switchMode = (mode: TimerMode) => {
    setCurrentMode(mode);
    setTimeLeft(getDuration(mode));
    setIsActive(false);
  };

  const updateSettings = (newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    // Update current timer if duration changed and not active
    if (!isActive) {
      setTimeLeft(getDurationForMode(currentMode, newSettings) * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = () => {
    const duration = getDuration();
    return duration > 0 ? ((duration - timeLeft) / duration) * 100 : 0;
  };

  return (
    <PomodoroContext.Provider
      value={{
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
        getDuration,
        getProgress,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
}
