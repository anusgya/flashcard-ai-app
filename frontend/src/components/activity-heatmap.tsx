"use client";

interface ActivityDay {
  date: Date;
  intensity: number;
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

import type React from "react";
import { useMemo, useState, useCallback } from "react";

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  day: ActivityDay | null;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({
  year = new Date().getFullYear(),
  onDayClick,
}) => {
  // State for tooltip visibility and position
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    day: null,
  });

  // Using useCallback to memoize the handlers
  const handleMouseEnter = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, day: ActivityDay) => {
      // Get the position of the hovered element
      const element = event.currentTarget;
      const rect = element.getBoundingClientRect();

      // Calculate tooltip position relative to the viewport
      const x = rect.left + rect.width / 2; // Center horizontally
      const y = rect.top - 5; // Position slightly above the element

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

  // Your existing data generation code remains the same
  const yearData: ActivityDay[] = useMemo(() => {
    // ... existing yearData generation code ...
    const data: ActivityDay[] = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      data.push({
        date: new Date(d),
        intensity: Math.floor(Math.random() * 5),
        activities: {
          cards: Math.floor(Math.random() * 50),
          time: Math.floor(Math.random() * 120),
          sessions: Math.floor(Math.random() * 5),
          quizzes: Math.floor(Math.random() * 3),
        },
      });
    }
    return data;
  }, [year]);

  // Your existing weeks calculation remains the same
  const weeks: ActivityDay[][] = useMemo(() => {
    // ... existing weeks calculation code ...
    const weeksArray: ActivityDay[][] = [];
    let currentWeek: ActivityDay[] = [];

    yearData.forEach((day) => {
      if (
        currentWeek.length === 7 ||
        (currentWeek.length === 0 && day.date.getDay() === 0)
      ) {
        if (currentWeek.length > 0) weeksArray.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    });

    if (currentWeek.length > 0) weeksArray.push(currentWeek);
    return weeksArray;
  }, [yearData]);

  const getIntensityColor = (intensity: number): string => {
    switch (intensity) {
      case 0:
        return "bg-[#21231E]"; // Darkest - replacing bg-secondary
      case 1:
        return "bg-[#3A590C]"; // Dark green - replacing bg-primary-green/20
      case 2:
        return "bg-[#4B7310]"; // Medium-dark green - replacing bg-primary-green/40
      case 3:
        return "bg-[#5B8C13]"; // Medium green - replacing bg-primary-green/60
      case 4:
        return "bg-[#74B218]"; // Light green - replacing bg-primary-green
      default:
        return "bg-[#21231E]"; // Darkest - replacing bg-secondary
    }
  };

  // Format date for tooltip display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const months: string[] = [
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
  const days: string[] = ["Mon", "Wed", "Fri"];

  return (
    <div className=" bg-background rounded-lg relative">
      {/* Month labels */}
      <div className="flex mb-2 text-[11px] font-fragment-mono text-secondary-foreground">
        <div className="w-8" />
        {months.map((month) => (
          <div key={month} className="flex-1 text-center">
            {month}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-2 text-[11px] font-fragment-mono text-secondary-foreground">
          {days.map((day) => (
            <div key={day} className="h-[10px] leading-[10px]">
              {day}
            </div>
          ))}
        </div>

        {/* Activity grid */}
        <div className="flex-1 flex gap-[3px] relative">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-[3px]">
              {week.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  onClick={() => onDayClick?.(day)}
                  onMouseEnter={(e) => handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    w-[10px] h-[10px] rounded-[2px]
                    ${getIntensityColor(day.intensity)}
                    hover:ring-1 hover:ring-primary-green
                    transition-all duration-200
                    cursor-pointer
                  `}
                />
              ))}
            </div>
          ))}

          {/* Tooltip */}
          {tooltip.visible && tooltip.day && (
            <div
              className="fixed z-50 bg-popover/95 backdrop-blur-sm text-popover-foreground p-3 rounded-md shadow-lg 
                       text-[11px] font-fragment-mono min-w-[200px] pointer-events-none
                       border border-border"
              style={{
                left: `${tooltip.x}px`,
                top: `${tooltip.y}px`,
                transform: "translate(-50%, -100%)", // Center horizontally and position above
              }}
            >
              <div className="font-medium mb-2 pb-2 border-b border-border">
                {formatDate(tooltip.day.date)}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between gap-8">
                  <span>Cards studied:</span>
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
                  <span>Sessions:</span>
                  <span className="font-medium">
                    {tooltip.day.activities.sessions}
                  </span>
                </div>
                <div className="flex justify-between gap-8">
                  <span>Quizzes:</span>
                  <span className="font-medium">
                    {tooltip.day.activities.quizzes}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 text-[11px] font-fragment-mono text-secondary-foreground">
        <span>Less</span>
        <div className="flex gap-[3px] mx-2">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-[10px] h-[10px] rounded-[2px] ${getIntensityColor(
                level
              )}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default ActivityHeatmap;
