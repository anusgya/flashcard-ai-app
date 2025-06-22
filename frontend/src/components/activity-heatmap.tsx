"use client";

import type React from "react";
import { useMemo, useState, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useActivityHeatmap,
  ActivityDay as ApiActivityDay,
} from "@/hooks/api/useAnalytics";
import { Skeleton } from "./ui/skeleton";

interface ActivityDay {
  date: Date;
  intensity: number;
  type: "no-activity" | "activity" | "future" | "padding";
  activities: {
    cards: number;
    time: number;
    sessions: number;
    quizzes: number;
  };
}

interface ActivityHeatmapProps {
  year?: number;
  onDayClick?: (day: ActivityDay) => void;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  day: ActivityDay | null;
}

const ActivityHeatmapSkeleton = () => (
  <div className="bg-background rounded-lg relative">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-lg font-medium">Activity Heatmap</h2>
      <div className="flex items-center space-x-2">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
    <div className="flex mb-2 text-[11px] font-fragment-mono text-secondary-foreground">
      <div className="w-8" />
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex-1 text-center">
          <Skeleton className="h-4 w-8 mx-auto" />
        </div>
      ))}
    </div>
    <div className="flex">
      <div className="flex flex-col justify-between mr-2 text-[11px] font-fragment-mono text-secondary-foreground h-[136px]">
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-4 w-6" />
      </div>
      <div className="flex-1 flex gap-[3px] relative">
        {[...Array(27)].map((_, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-[3px]">
            {[...Array(7)].map((_, dayIndex) => (
              <Skeleton
                key={dayIndex}
                className="w-[16px] h-[16px] rounded-[2px]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  year = new Date().getFullYear(),
  onDayClick,
}) => {
  const { activityData, isLoading, isError } = useActivityHeatmap(year);

  const yearData = useMemo((): ActivityDay[] => {
    if (!activityData) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activityData.map((apiDay: ApiActivityDay) => {
      const parts = apiDay.date.split("-").map(Number);
      const dayDate = new Date(parts[0], parts[1] - 1, parts[2]);

      const isFuture = dayDate > today;
      const hasActivity = !isFuture && apiDay.intensity > 0;

      return {
        date: dayDate,
        intensity: hasActivity ? apiDay.intensity : 0,
        type: hasActivity ? "activity" : "no-activity",
        activities: {
          cards: apiDay.activities.cards_studied,
          time: apiDay.activities.time_spent_minutes,
          sessions: apiDay.activities.study_sessions,
          quizzes: apiDay.activities.quiz_sessions,
        },
      };
    });
  }, [activityData]);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();

  const [startMonth, setStartMonth] = useState(() => {
    return Math.max(0, currentMonth - 5);
  });

  const endMonth = Math.min(startMonth + 5, 11);

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    day: null,
  });

  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, day: ActivityDay) => {
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top - 5;

      setTooltip({
        visible: true,
        x: x,
        y: y,
        day: day,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  }, []);

  const filteredData = useMemo(() => {
    return yearData.filter((day) => {
      const month = day.date.getMonth();
      return month >= startMonth && month <= endMonth;
    });
  }, [startMonth, endMonth, yearData]);

  const weeks: ActivityDay[][] = useMemo(() => {
    const weeksArray: ActivityDay[][] = [];
    if (filteredData.length === 0) return weeksArray;

    const firstDayOfMonth = new Date(year, startMonth, 1);
    const paddingDays = firstDayOfMonth.getDay();

    const paddingDaysArray: ActivityDay[] = Array.from(
      { length: paddingDays },
      (_, i) => {
        const paddingDate = new Date(firstDayOfMonth);
        paddingDate.setDate(paddingDate.getDate() - (paddingDays - i));
        return {
          date: paddingDate,
          intensity: 0,
          type: "padding",
          activities: { cards: 0, time: 0, sessions: 0, quizzes: 0 },
        };
      }
    );

    const allDays = [...paddingDaysArray, ...filteredData];

    for (let i = 0; i < allDays.length; i += 7) {
      weeksArray.push(allDays.slice(i, i + 7));
    }

    return weeksArray;
  }, [filteredData, startMonth, year]);

  const getIntensityColor = (day: ActivityDay): string => {
    if (day.type === "padding") return "bg-transparent";
    if (day.type === "no-activity") return "bg-[#2D302A]";

    switch (day.intensity) {
      case 1:
        return "bg-[#3A590C]";
      case 2:
        return "bg-[#4B7310]";
      case 3:
        return "bg-[#5B8C13]";
      case 4:
        return "bg-[#74B218]";
      default:
        return "bg-[#21231E]";
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const visibleMonths = useMemo(() => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return months.slice(startMonth, endMonth + 1);
  }, [startMonth, endMonth]);

  const displayDays: string[] = ["", "Mon", "", "Wed", "", "Fri", ""];

  const handlePrevious = () => setStartMonth((prev) => Math.max(0, prev - 1));
  const handleNext = () => setStartMonth((prev) => Math.min(6, prev + 1));

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (currentMonth > endMonth) {
      setStartMonth(Math.max(0, currentMonth - 5));
    } else if (currentMonth < startMonth) {
      setStartMonth(currentMonth);
    }
  }, [startMonth, endMonth]);

  if (isLoading) {
    return <ActivityHeatmapSkeleton />;
  }

  if (isError) {
    return (
      <div className="bg-background rounded-lg p-4 flex items-center justify-center h-[240px]">
        <p className="text-destructive-foreground">
          Failed to load activity data.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Activity Heatmap</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            disabled={startMonth === 0}
            className={`p-1 rounded-full ${
              startMonth === 0 ? "text-gray-500" : "hover:bg-gray-700"
            }`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={endMonth >= 11}
            className={`p-1 rounded-full ${
              endMonth >= 11 ? "text-gray-500" : "hover:bg-gray-700"
            }`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex mb-2 text-[11px] font-fragment-mono text-secondary-foreground">
        <div className="w-8" />
        {visibleMonths.map((month) => {
          const monthIndex = new Date(year, startMonth).getMonth();
          const weeksInMonth = weeks.filter((week) =>
            week.some(
              (day) =>
                day.date.getMonth() === monthIndex && day.type !== "padding"
            )
          ).length;
          const flexBasis = `${weeksInMonth * (16 + 3)}px`;

          return (
            <div key={month} style={{ flexBasis }} className="text-center">
              {month}
            </div>
          );
        })}
      </div>

      <div className="flex">
        <div className="flex flex-col justify-between mr-2 text-[11px] font-fragment-mono text-secondary-foreground h-[136px]">
          {displayDays.map((day, index) => (
            <div key={index} className="h-[16px] leading-[16px]">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 flex gap-[3px] relative">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => day.type !== "padding" && onDayClick?.(day)}
                  onMouseEnter={(e) =>
                    day.type !== "padding" && handleMouseEnter(e, day)
                  }
                  onMouseLeave={handleMouseLeave}
                  className={`
                    w-[16px] h-[16px] rounded-[2px]
                    ${getIntensityColor(day)}
                    ${
                      day.type !== "padding"
                        ? "hover:ring-1 hover:ring-primary-green"
                        : ""
                    }
                    transition-all duration-200
                    ${
                      day.type !== "padding"
                        ? "cursor-pointer"
                        : "cursor-default"
                    }
                  `}
                />
              ))}
            </div>
          ))}

          {tooltip.visible && tooltip.day && (
            <div
              className="fixed z-50 bg-popover/95 backdrop-blur-sm text-popover-foreground p-3 rounded-md shadow-lg 
                       text-[11px] font-fragment-mono min-w-[200px] pointer-events-none
                       border border-border"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div className="font-medium mb-2 pb-2 border-b border-border">
                {formatDate(tooltip.day.date)}
              </div>
              <div className="space-y-1.5">
                {tooltip.day.type === "no-activity" ? (
                  <div>No activity recorded on this day</div>
                ) : (
                  <>
                    <div className="flex justify-between gap-8">
                      <span>Cards learned:</span>
                      <span className="font-medium">
                        {tooltip.day.activities.cards}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Study time:</span>
                      <span className="font-medium">
                        {tooltip.day.activities.time} min
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Learning Sessions:</span>
                      <span className="font-medium">
                        {tooltip.day.activities.sessions}
                      </span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Quizz Sessions:</span>
                      <span className="font-medium">
                        {tooltip.day.activities.quizzes}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end mt-4 text-[11px] font-fragment-mono text-secondary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-[16px] h-[16px] rounded-[2px] bg-[#2D302A] mr-1" />
            <span>No Activity</span>
          </div>
          <div className="flex items-center ml-2">
            <span>Less</span>
            <div className="flex gap-[3px] mx-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-[16px] h-[16px] rounded-[2px] ${getIntensityColor(
                    {
                      intensity: level,
                      type: "activity",
                      date: new Date(),
                      activities: {
                        cards: 0,
                        time: 0,
                        sessions: 0,
                        quizzes: 0,
                      },
                    }
                  )}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
