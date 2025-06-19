"use client";

import { useState, useEffect } from "react";
import { useAnalyticsDashboard, TimeRange } from "@/hooks/api/useAnalytics";
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
} from "recharts";
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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import StatCard from "@/components/ui/stat-card";

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>(TimeRange.ALL);
  const { analytics, isLoading, isError } = useAnalyticsDashboard(timeRange);
  const [activeTab, setActiveTab] = useState("overview");
  const [showInsights, setShowInsights] = useState(false);
  const [progressValues, setProgressValues] = useState({
    effectiveness: 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
  });

  useEffect(() => {
    // Reset progress values when time range changes
    setProgressValues({
      effectiveness: 0,
      daily: 0,
      weekly: 0,
      monthly: 0,
    });

    if (analytics) {
      // Animate progress bars
      const timer = setTimeout(() => {
        setProgressValues({
          effectiveness: analytics.learningEffectivenessScore,
          daily: analytics.sessionFrequency?.daily.percentage || 0,
          weekly: analytics.sessionFrequency?.weekly.percentage || 0,
          monthly: analytics.sessionFrequency?.monthly.percentage || 0,
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [analytics, timeRange]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-blue/20 rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-blue rounded-full animate-spin"></div>
            {/* <Brain className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary-blue h-8 w-8" /> */}
          </div>
          <p className="text-foreground animate-pulse">
            Loading your learning insights...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !analytics) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-background">
        <div className="bg-destructive/10 p-8 rounded-lg text-destructive max-w-md mx-auto text-center">
          <div className="flex justify-center mb-4">
            <Info className="h-12 w-12 text-destructive" />
          </div>
          <h3 className="text-xl font-bold mb-2">Unable to Load Analytics</h3>
          <p className="font-medium mb-4">
            We couldn't retrieve your learning data at this time.
          </p>
          <Button variant="outline" className="bg-background hover:bg-accent">
            Try Again
          </Button>
        </div>
      </div>
    );
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
  } = analytics;

  // Custom color function for streak calendar
  const getStreakColor = (value: number) => {
    if (!value) return "var(--muted)";
    return `rgba(76, 175, 80, ${value * 0.2 + 0.3})`;
  };

  // Get trend indicator
  const getTrendIndicator = (value: number) => {
    if (value > 0) {
      return (
        <div className="flex items-center text-green-500">
          <ChevronUp className="h-4 w-4" />
          <span className="text-xs">{value}%</span>
        </div>
      );
    } else if (value < 0) {
      return (
        <div className="flex items-center text-orange-500">
          <ChevronDown className="h-4 w-4" />
          <span className="text-xs">{Math.abs(value)}%</span>
        </div>
      );
    }
    return (
      <div className="flex items-center text-secondary-foreground">
        <span className="text-xs">0%</span>
      </div>
    );
  };

  return (
    <div className="bg-background min-h-screen py-16 px-12 font-inter relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-primary-blue/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-t from-primary-green/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header with time range selector */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6">
          <div className="flex gap-2 flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Learning Analytics
              </h1>
            </div>
            <p className="text-secondary-foreground text-sm font-fragment-mono mt-1">
              Track your progress and optimize your learning journey
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={timeRange === TimeRange.TODAY ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(TimeRange.TODAY)}
              className="min-w-[80px]"
            >
              Day
            </Button>
            <Button
              variant={timeRange === TimeRange.WEEK ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(TimeRange.WEEK)}
              className="min-w-[80px]"
            >
              Week
            </Button>
            <Button
              variant={timeRange === TimeRange.MONTH ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(TimeRange.MONTH)}
              className="min-w-[80px]"
            >
              Month
            </Button>
            <Button
              variant={timeRange === TimeRange.ALL ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(TimeRange.ALL)}
              className="min-w-[80px]"
            >
              All
            </Button>
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
                      <h3 className="text-lg font-semibold mb-2">
                        Learning Insights
                      </h3>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <span className="text-primary-blue">•</span>
                          <p className="text-sm">
                            Your learning effectiveness has increased by 12%
                            compared to last week. Keep up the good work!
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-green">•</span>
                          <p className="text-sm">
                            You perform better in the morning. Consider
                            scheduling more study sessions before noon.
                          </p>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-primary-orange">•</span>
                          <p className="text-sm">
                            Your quiz performance is lower than your study
                            performance. Try more practice tests to improve
                            retention.
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
              <StatCard
                title="Current Streak"
                value={currentStreak}
                unit="days"
                icon={<Flame className="text-primary-green h-6 w-6" />}
                trend={5}
                additionalInfo={`Best: ${longestStreak} days`}
                className="hover:border-primary-green/30"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <StatCard
                title="Total Study Time"
                value={totalStudyTime}
                unit="hours"
                icon={<Clock className="text-primary-blue h-6 w-6" />}
                trend={12}
                additionalInfo={`Avg: ${averageSessionDuration} min/session`}
                className="hover:border-primary-blue/30"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <StatCard
                title="Leaderboard Rank"
                value={`#${rankingData?.weekly}`}
                unit={`of ${rankingData?.totalUsers}`}
                icon={<Award className="text-primary-orange h-6 w-6" />}
                trend={-2}
                additionalInfo={`Top ${Math.round(
                  (rankingData?.weekly / rankingData?.totalUsers) * 100
                )}%`}
                className="hover:border-primary-orange/30"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <StatCard
                title="Effectiveness"
                value={learningEffectivenessScore}
                unit="/100"
                icon={<Target className="text-primary-purple h-6 w-6" />}
                trend={8}
                showProgress={true}
                progressValue={progressValues.effectiveness}
                className="hover:border-primary-purple/30"
              />
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
                      {timeRange === TimeRange.TODAY
                        ? "Last 24 hours"
                        : timeRange === TimeRange.WEEK
                        ? "Last 7 days"
                        : timeRange === TimeRange.MONTH
                        ? "Last 30 days"
                        : "All time"}
                    </Badge>
                  </div>
                  <CardDescription>
                    Compare your performance in quizzes vs. study sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-12 h-12">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-blue/20 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-blue rounded-full animate-spin"></div>
                          </div>
                          <p className="text-secondary-foreground text-sm">
                            Loading data...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={quizVsStudyData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorQuiz"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#FF9800"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#FF9800"
                                stopOpacity={0}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorStudy"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2196F3"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2196F3"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                          />
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
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            }}
                            itemStyle={{ color: "var(--foreground)" }}
                            labelStyle={{
                              color: "var(--foreground)",
                              fontWeight: "bold",
                              marginBottom: "0.5rem",
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: "1rem" }}
                            formatter={(value) => (
                              <span style={{ color: "var(--foreground)" }}>
                                {value}
                              </span>
                            )}
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
                    )}
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
                  <CardDescription>
                    How you've earned your learning points
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={pointsData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
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
                            boxShadow:
                              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          cursor={{ fill: "var(--accent)", opacity: 0.3 }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{
                            color: "var(--foreground)",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                          }}
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
                  <CardDescription>
                    Your learning performance over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    {isLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="relative w-12 h-12">
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-primary-blue/20 rounded-full"></div>
                            <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary-blue rounded-full animate-spin"></div>
                          </div>
                          <p className="text-secondary-foreground text-sm">
                            Loading data...
                          </p>
                        </div>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={studyTrendData}
                          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorAccuracy"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#2196F3"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#2196F3"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                          />
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
                              boxShadow:
                                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                            }}
                            itemStyle={{ color: "var(--foreground)" }}
                            labelStyle={{
                              color: "var(--foreground)",
                              fontWeight: "bold",
                              marginBottom: "0.5rem",
                            }}
                          />
                          <Legend
                            wrapperStyle={{ paddingTop: "1rem" }}
                            formatter={(value) => (
                              <span style={{ color: "var(--foreground)" }}>
                                {value}
                              </span>
                            )}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            name="Accuracy %"
                            stroke="#2196F3"
                            strokeWidth={3}
                            dot={{
                              stroke: "#2196F3",
                              strokeWidth: 2,
                              r: 4,
                              fill: "var(--card)",
                            }}
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
                            dot={{
                              stroke: "#FF9800",
                              strokeWidth: 2,
                              r: 4,
                              fill: "var(--card)",
                            }}
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
                            dot={{
                              stroke: "#4CAF50",
                              strokeWidth: 2,
                              r: 4,
                              fill: "var(--card)",
                            }}
                            activeDot={{
                              r: 6,
                              stroke: "#4CAF50",
                              strokeWidth: 2,
                              fill: "#4CAF50",
                            }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
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
                  <CardDescription>
                    Distribution of your answer quality
                  </CardDescription>
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
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
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
                            boxShadow:
                              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                          }}
                          itemStyle={{ color: "var(--foreground)" }}
                          labelStyle={{
                            color: "var(--foreground)",
                            fontWeight: "bold",
                            marginBottom: "0.5rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
