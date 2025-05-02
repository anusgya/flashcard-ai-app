"use client"

interface ActivityDay {
  date: Date
  intensity: number
  type: "no-activity" | "activity" | "future" | "padding"
  activities: {
    cards: number
    time: number
    sessions: number
    quizzes: number
  }
}

interface ActivityHeatmapProps {
  year?: number
  onDayClick?: (day: ActivityDay) => void
}

import type React from "react"
import { useMemo, useState, useCallback, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TooltipState {
  visible: boolean
  x: number
  y: number
  day: ActivityDay | null
}

// Function to generate static data for a given year
const generateStaticYearData = (year: number): ActivityDay[] => {
  const data: ActivityDay[] = []
  const currentDate = new Date()
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)

  // Use a fixed seed for random number generation
  const seededRandom = (seed: number) => {
    return () => {
      // Simple pseudo-random number generator
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }

  // Create a random generator with a fixed seed
  const random = seededRandom(year * 10000)

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const isToday = d.toDateString() === currentDate.toDateString()
    const isFuture = d > currentDate

    // Generate a deterministic intensity based on the date
    const dayOfYear = Math.floor((d.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000))
    const randomValue = random() // Get a random value between 0 and 1
    const intensity = Math.floor(randomValue * 5)

    // Determine if the day has activity (not in the future and intensity > 0)
    const hasActivity = !isFuture && intensity > 0

    data.push({
      date: new Date(d),
      intensity: hasActivity ? intensity : 0,
      type: isFuture ? "future" : hasActivity ? "activity" : "no-activity",
      activities: {
        cards: hasActivity ? Math.floor(randomValue * 50) : 0,
        time: hasActivity ? Math.floor(randomValue * 120) : 0,
        sessions: hasActivity ? Math.floor(randomValue * 5) : 0,
        quizzes: hasActivity ? Math.floor(randomValue * 3) : 0,
      },
    })
  }

  return data
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ year = new Date().getFullYear(), onDayClick }) => {
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()

  // Store the generated data in a ref so it doesn't change on re-renders
  const yearDataRef = useRef<ActivityDay[]>([])

  // Initialize the data if it hasn't been generated yet
  if (yearDataRef.current.length === 0) {
    yearDataRef.current = generateStaticYearData(year)
  }

  // State to track which 6-month window we're displaying
  // Default to showing the current month and 5 months before
  const [startMonth, setStartMonth] = useState(() => {
    // If we're in the first half of the year, start from January
    // Otherwise, start from current month - 5 (to show 6 months including current)
    return Math.max(0, currentMonth - 5)
  })

  // Calculate end month (startMonth + 5, but not exceeding 11 which is December)
  const endMonth = Math.min(startMonth + 5, 11)

  // State for tooltip visibility and position
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    day: null,
  })

  // Using useCallback to memoize the handlers
  const handleMouseEnter = useCallback((event: React.MouseEvent<HTMLDivElement>, day: ActivityDay) => {
    // Get the position of the hovered element
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()

    // Calculate tooltip position relative to the viewport
    const x = rect.left + rect.width / 2 // Center horizontally
    const y = rect.top - 5 // Position slightly above the element

    setTooltip({
      visible: true,
      x: x,
      y: y,
      day: day,
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip((prev) => ({ ...prev, visible: false }))
  }, [])

  // Filter data to only include the months we want to display
  const filteredData = useMemo(() => {
    return yearDataRef.current.filter((day) => {
      const month = day.date.getMonth()
      return month >= startMonth && month <= endMonth
    })
  }, [startMonth, endMonth])

  // Organize days into weeks, ensuring 7 days per week
  const weeks: ActivityDay[][] = useMemo(() => {
    const weeksArray: ActivityDay[][] = []

    if (filteredData.length === 0) return weeksArray

    // Get the first day of the filtered data
    const firstDay = new Date(filteredData[0].date)
    firstDay.setDate(1) // Set to first day of the month

    // Calculate padding days for the first week
    const paddingDays = firstDay.getDay()

    // Create padding days for the start of the first week
    const paddingDaysArray: ActivityDay[] = []
    for (let i = 0; i < paddingDays; i++) {
      const paddingDate = new Date(firstDay)
      paddingDate.setDate(paddingDate.getDate() - (paddingDays - i))
      paddingDaysArray.push({
        date: paddingDate,
        intensity: 0,
        type: "padding",
        activities: { cards: 0, time: 0, sessions: 0, quizzes: 0 },
      })
    }

    // Combine padding days with filtered data
    const allDays = [...paddingDaysArray, ...filteredData]

    // Split into weeks of exactly 7 days
    for (let i = 0; i < allDays.length; i += 7) {
      const weekDays = allDays.slice(i, i + 7)
      if (weekDays.length > 0) {
        weeksArray.push(weekDays)
      }
    }

    return weeksArray
  }, [filteredData])

  const getIntensityColor = (day: ActivityDay): string => {
    // Different styling for different types of days
    if (day.type === "future") {
      return "bg-[#1A1C19]" // Very dark gray for future dates
    } else if (day.type === "padding") {
      return "bg-[#1A1C19]/50" // Transparent dark for padding days
    } else if (day.type === "no-activity") {
      return "bg-[#2D302A]" // Lighter gray for days with no activity
    }

    // For days with activity, use the intensity scale
    switch (day.intensity) {
      case 1:
        return "bg-[#3A590C]" // Dark green
      case 2:
        return "bg-[#4B7310]" // Medium-dark green
      case 3:
        return "bg-[#5B8C13]" // Medium green
      case 4:
        return "bg-[#74B218]" // Light green
      default:
        return "bg-[#21231E]" // Fallback
    }
  }

  // Format date for tooltip display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Get visible months for display
  const visibleMonths = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return months.slice(startMonth, endMonth + 1)
  }, [startMonth, endMonth])

  // All 7 days of the week
  const days: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  // We'll display only some days to avoid crowding
  const displayDays: string[] = ["", "Mon", "", "Wed", "", "Fri", ""]

  // Navigation handlers
  const handlePrevious = () => {
    setStartMonth((prev) => Math.max(0, prev - 1))
  }

  const handleNext = () => {
    setStartMonth((prev) => Math.min(6, prev + 1)) // 6 is the max start month (showing Jul-Dec)
  }

  // Auto-update the view as time progresses
  useEffect(() => {
    // Check if the current month is within our view
    const currentMonth = new Date().getMonth()

    // If current month is after our view, shift the view
    if (currentMonth > endMonth) {
      setStartMonth(Math.max(0, currentMonth - 5))
    }
    // If current month is before our view, shift the view
    else if (currentMonth < startMonth) {
      setStartMonth(currentMonth)
    }
  }, [startMonth, endMonth])

  return (
    <div className="bg-background rounded-lg relative">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-medium">Activity Heatmap</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            disabled={startMonth === 0}
            className={`p-1 rounded-full ${startMonth === 0 ? "text-gray-500" : "hover:bg-gray-700"}`}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={endMonth >= 11}
            className={`p-1 rounded-full ${endMonth >= 11 ? "text-gray-500" : "hover:bg-gray-700"}`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-2 text-[11px] font-fragment-mono text-secondary-foreground">
        <div className="w-8" />
        {visibleMonths.map((month) => (
          <div key={month} className="flex-1 text-center">
            {month}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-2 text-[11px] font-fragment-mono text-secondary-foreground h-[136px]">
          {displayDays.map((day, index) => (
            <div key={index} className="h-[16px] leading-[16px]">
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
                  onClick={() => day.type !== "padding" && onDayClick?.(day)}
                  onMouseEnter={(e) => day.type !== "padding" && handleMouseEnter(e, day)}
                  onMouseLeave={handleMouseLeave}
                  className={`
                    w-[16px] h-[16px] rounded-[2px]
                    ${getIntensityColor(day)}
                    ${day.type !== "padding" ? "hover:ring-1 hover:ring-primary-green" : ""}
                    transition-all duration-200
                    ${day.type !== "padding" ? "cursor-pointer" : "cursor-default"}
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
                {tooltip.day.type === "future" && " (Upcoming)"}
              </div>
              <div className="space-y-1.5">
                {tooltip.day.type === "future" ? (
                  <div>No data available for future dates</div>
                ) : tooltip.day.type === "no-activity" ? (
                  <div>No activity recorded on this day</div>
                ) : (
                  <>
                    <div className="flex justify-between gap-8">
                      <span>Cards studied:</span>
                      <span className="font-medium">{tooltip.day.activities.cards}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Study time:</span>
                      <span className="font-medium">{tooltip.day.activities.time} min</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Sessions:</span>
                      <span className="font-medium">{tooltip.day.activities.sessions}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span>Quizzes:</span>
                      <span className="font-medium">{tooltip.day.activities.quizzes}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 text-[11px] font-fragment-mono text-secondary-foreground">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-[16px] h-[16px] rounded-[2px] bg-[#1A1C19] mr-1" />
            <span>Future</span>
          </div>
          <div className="flex items-center ml-2">
            <div className="w-[16px] h-[16px] rounded-[2px] bg-[#2D302A] mr-1" />
            <span>No Activity</span>
          </div>
          <div className="flex items-center ml-2">
            <span>Activity:</span>
            <div className="flex gap-[3px] mx-2">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`w-[16px] h-[16px] rounded-[2px] ${getIntensityColor({
                    intensity: level,
                    type: "activity",
                    date: new Date(),
                    activities: { cards: 0, time: 0, sessions: 0, quizzes: 0 },
                  })}`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ActivityHeatmap
