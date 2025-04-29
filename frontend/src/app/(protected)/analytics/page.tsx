"use client"

import { useState, useEffect } from "react"
import { useAnalyticsDashboard, TimeRange } from "@/hooks/api/useAnalytics"
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import {
  Clock,
  Award,
  TrendingUp,
  BarChart2,
  PieChartIcon,
  Activity,
  Brain,
  Target,
  ChevronUp,
  ChevronDown,
  Lightbulb,
  Flame,
  Info,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL)
  const { analytics, isLoading, isError } = useAnalyticsDashboard(timeRange)
  const [activeTab, setActiveTab] = useState("overview")
  const [showInsights, setShowInsights] = useState(false)
  const [progressValues, setProgressValues] = useState({
    effectiveness: 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
  })

  useEffect(() => {
    if (analytics) {
      // Animate progress bars
      const timer = setTimeout(() => {
        setProgressValues({
          effectiveness: analytics.learningEffectivenessScore,
          daily: analytics.sessionFrequency?.daily.percentage || 0,
          weekly: analytics.sessionFrequency?.weekly.percentage || 0,
          monthly: analytics.sessionFrequency?.monthly.percentage || 0,
        })
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [analytics])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-blue/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-blue rounded-full animate-spin"></div>
            <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-blue h-8 w-8" />
          </div>
          <p className="text-secondary-foreground animate-pulse">Loading your learning insights...</p>
        </div>
      </div>
    )
  }

  if (isError || !analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-destructive/10 p-8 rounded-lg text-destructive max-w-md mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Info className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-xl font-bold mb-2">Unable to Load Analytics</h3>
          <p className="font-medium mb-4">We couldn't retrieve your learning data at this time.</p>
          <Button variant="outline" className="bg-background hover:bg-accent">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Extract data from analytics object
  const {
    learningEffectivenessScore,
    currentStreak,
    longestStreak,
    totalStudyTime,
    averageSessionDuration,
    studyTrendData,
    responseQualityData,
    streakData,
    quizVsStudyData,
    difficultCardsData,
    pointsData,
    rankingData,
    sessionFrequency,
  } = analytics

  // Custom color function for streak calendar
  const getStreakColor = (value: number) => {
    if (!value) return "var(--muted)"
    return `rgba(76, 175, 80, ${value * 0.2 + 0.3})`
  }

  // Get trend indicator
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs">{value}%</span>
        </div>
      )
    } else if (value < 0) {
      return (
        <div className="flex items-center text-orange-500">
          <ChevronDown className="h-4 w-4" />
          <span className="text-xs">{Math.abs(value)}%</span>
        </div>
      )
    }
    return (
      <div className="flex items-center text-secondary-foreground">
        <span className="text-xs">0%</span>
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen py-16 px-12  font-inter relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-primary-blue/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-primary-green/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header with time range selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
          <div className="flex gap-2 flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Learning Analytics</h1>
            </div>
            <p className="text-secondary-foreground text-sm font-fragment-mono mt-1 ">
              Track your progress and optimize your learning journey
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-secondary-foreground hover:text-foreground"
            onClick={() => setShowInsights(!showInsights)}
          >
            <Lightbulb className="h-4 w-4 mr-2" />
            {showInsights ? "Hide Insights" : "Show Insights"}
          </Button>
        </div>

        <AnimatePresence>
          {showInsights && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <Card className="border-primary-blue/20 bg-primary-blue/5 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="bg-primary-blue/10 p-3 rounded-full">
                      <Lightbulb className="h-5 w-5 text-primary-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Learning Insights</h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-primary-blue">•</span>
                          <p className="text-sm">
                            Your learning effectiveness has increased by 12% compared to last week. Keep up the good
                            work!
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-green">•</span>
                          <p className="text-sm">
                            You perform better in the morning. Consider scheduling more study sessions before noon.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-orange">•</span>
                          <p className="text-sm">
                            Your quiz performance is lower than your study performance. Try more practice tests to
                            improve retention.
                          </p>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-6 mt-6">
          {/* Key metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="overflow-hidden border-divider hover:border-primary-green/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-green/10 rounded-full group-hover:bg-primary-green/20 transition-colors duration-300">
                      <Flame className="text-primary-green h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-foreground">Current Streak</p>
                        {getTrendIndicator(5)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-foreground">{currentStreak}</p>
                        <p className="text-sm text-secondary-foreground">days</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Best: {longestStreak} days</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-green/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="overflow-hidden border-divider hover:border-primary-blue/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-blue/10 rounded-full group-hover:bg-primary-blue/20 transition-colors duration-300">
                      <Clock className="text-primary-blue h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-foreground">Total Study Time</p>
                        {getTrendIndicator(12)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-foreground">{totalStudyTime}</p>
                        <p className="text-sm text-secondary-foreground">hours</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Avg: {averageSessionDuration} min/session</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-blue/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-divider hover:border-primary-orange/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-orange/10 rounded-full group-hover:bg-primary-orange/20 transition-colors duration-300">
                      <Award className="text-primary-orange h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-foreground">Leaderboard Rank</p>
                        {getTrendIndicator(-2)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-foreground">#{rankingData?.weekly}</p>
                        <p className="text-sm text-secondary-foreground">of {rankingData?.totalUsers}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Top {Math.round((rankingData?.weekly / rankingData?.totalUsers) * 100)}%
                      </p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-orange/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-divider hover:border-primary-purple/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-purple/10 rounded-full group-hover:bg-primary-purple/20 transition-colors duration-300">
                      <Target className="text-primary-purple h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-secondary-foreground">Learning Effectiveness</p>
                        {getTrendIndicator(8)}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-bold text-foreground">{learningEffectivenessScore}</p>
                        <p className="text-sm text-secondary-foreground">/100</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Progress value={progressValues.effectiveness} className="h-2" />
                  </div>
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-purple/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Quiz vs Study Performance Gap */}
            <motion.div
              className="lg:col-span-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-primary-blue h-5 w-5" />
                      <CardTitle>Quiz vs. Study Performance</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-accent/50">
                      Last{" "}
                      {timeRange === TimeRange.TODAY
                        ? "24 hours"
                        : timeRange === TimeRange.WEEK
                          ? "7 days"
                          : timeRange === TimeRange.MONTH
                            ? "30 days"
                            : "all time"}
                    </Badge>
                  </div>
                  <CardDescription>Compare your performance in quizzes vs. study sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={quizVsStudyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorQuiz" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#FF9800" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#FF9800" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorStudy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <YAxis
                          domain={[0, 100]}
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{ color: "var(--foreground)", fontWeight: "bold", marginBottom: "0.5rem" }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: "1rem" }}
                          formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
                        />
                        <Area
                          type="monotone"
                          dataKey="quizAccuracy"
                          name="Quiz Accuracy"
                          stroke="#FF9800"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorQuiz)"
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="studyAccuracy"
                          name="Study Accuracy"
                          stroke="#2196F3"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorStudy)"
                          activeDot={{ r: 8, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Points Distribution */}
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="text-primary-green h-5 w-5" />
                    <CardTitle>Points Breakdown</CardTitle>
                  </div>
                  <CardDescription>How you've earned your learning points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pointsData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          horizontal={true}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <YAxis
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{ color: "var(--foreground)", fontWeight: "bold", marginBottom: "0.5rem" }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                          {pointsData?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || "#4CAF50"}
                              style={{ filter: "brightness(1.1)" }}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Study Trend */}
            <motion.div
              className="lg:col-span-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="text-primary-green h-5 w-5" />
                    <CardTitle>Study Trend</CardTitle>
                  </div>
                  <CardDescription>Your learning performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={studyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2196F3" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2196F3" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                          dataKey="interval"
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <YAxis
                          stroke="var(--secondary-foreground)"
                          tick={{ fill: "var(--secondary-foreground)" }}
                          axisLine={{ stroke: "var(--border)" }}
                          tickLine={{ stroke: "var(--border)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{ color: "var(--foreground)", fontWeight: "bold", marginBottom: "0.5rem" }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: "1rem" }}
                          formatter={(value) => <span style={{ color: "var(--foreground)" }}>{value}</span>}
                        />
                        <Line
                          type="monotone"
                          dataKey="accuracy"
                          name="Accuracy %"
                          stroke="#2196F3"
                          strokeWidth={3}
                          dot={{ stroke: "#2196F3", strokeWidth: 2, r: 4, fill: "var(--card)" }}
                          activeDot={{
                            r: 6,
                            stroke: "#2196F3",
                            strokeWidth: 2,
                            fill: "#2196F3",
                          }}
                          fillOpacity={1}
                          fill="url(#colorAccuracy)"
                        />
                        <Line
                          type="monotone"
                          dataKey="cardsStudied"
                          name="Cards Studied"
                          stroke="#FF9800"
                          strokeWidth={2}
                          dot={{ stroke: "#FF9800", strokeWidth: 2, r: 4, fill: "var(--card)" }}
                          activeDot={{
                            r: 6,
                            stroke: "#FF9800",
                            strokeWidth: 2,
                            fill: "#FF9800",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="timeSpent"
                          name="Time (min)"
                          stroke="#4CAF50"
                          strokeWidth={2}
                          dot={{ stroke: "#4CAF50", strokeWidth: 2, r: 4, fill: "var(--card)" }}
                          activeDot={{
                            r: 6,
                            stroke: "#4CAF50",
                            strokeWidth: 2,
                            fill: "#4CAF50",
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Response Quality Distribution */}
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <PieChartIcon className="text-primary-orange h-5 w-5" />
                    <CardTitle>Response Quality</CardTitle>
                  </div>
                  <CardDescription>Distribution of your answer quality</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={responseQualityData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {responseQualityData?.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color || "#4CAF50"}
                              stroke="var(--card)"
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            borderColor: "var(--border)",
                            color: "var(--foreground)",
                            borderRadius: "0.5rem",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{ color: "var(--foreground)", fontWeight: "bold", marginBottom: "0.5rem" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Session Frequency */}
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle>Session Frequency</CardTitle>
                  <CardDescription>How often you study across different time periods</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-secondary-foreground">Daily</span>
                      <span className="text-sm font-medium text-foreground">
                        {sessionFrequency?.daily.count} sessions
                      </span>
                    </div>
                    <Progress value={progressValues.daily} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-secondary-foreground">Weekly</span>
                      <span className="text-sm font-medium text-foreground">
                        {sessionFrequency?.weekly.count} sessions
                      </span>
                    </div>
                    <Progress value={progressValues.weekly} className="h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-secondary-foreground">Monthly</span>
                      <span className="text-sm font-medium text-foreground">
                        {sessionFrequency?.monthly.count} sessions
                      </span>
                    </div>
                    <Progress value={progressValues.monthly} className="h-3" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Card className="bg-accent/50 p-4">
                      <p className="text-xs font-medium text-secondary-foreground mb-1">Avg. Session</p>
                      <p className="text-2xl font-bold text-foreground">
                        {averageSessionDuration} <span className="text-sm font-normal">min</span>
                      </p>
                    </Card>
                    <Card className="bg-accent/50 p-4">
                      <p className="text-xs font-medium text-secondary-foreground mb-1">Total Time</p>
                      <p className="text-2xl font-bold text-foreground">
                        {totalStudyTime} <span className="text-sm font-normal">hrs</span>
                      </p>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Streak Calendar */}
            <motion.div
              className="lg:col-span-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.8 }}
            >
              <Card className="border-divider hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <CardTitle>Study Streak Calendar</CardTitle>
                  <CardDescription>Your daily learning consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-3 mb-6">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-xs font-medium text-secondary-foreground text-center">
                        {day}
                      </div>
                    ))}
                    {streakData.map((day, index) => (
                      <motion.div
                        key={index}
                        className="flex flex-col items-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.01 }}
                      >
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center text-foreground transition-all duration-200 hover:scale-110 cursor-pointer relative group"
                          style={{
                            backgroundColor: getStreakColor(day.value),
                            boxShadow: day.value ? "0 0 8px rgba(76, 175, 80, 0.3)" : "none",
                          }}
                        >
                          {day.value ? "✓" : ""}
                          {day.value > 0 && (
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-card px-2 py-1 rounded text-xs border border-divider opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                              {day.date}: {day.value * 30} min
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <Card className="bg-accent/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-secondary-foreground mb-1">Current Streak</p>
                        <p className="text-2xl font-bold text-foreground">
                          {currentStreak} <span className="text-sm font-normal">days</span>
                        </p>
                      </div>
                      <div className="h-10 w-px bg-divider mx-4"></div>
                      <div>
                        <p className="text-sm text-secondary-foreground mb-1">Longest Streak</p>
                        <p className="text-2xl font-bold text-foreground">
                          {longestStreak} <span className="text-sm font-normal">days</span>
                        </p>
                      </div>
                    </div>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
