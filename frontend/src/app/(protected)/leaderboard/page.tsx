"use client";

import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Medal,
  Star,
  Crown,
  ChevronUp,
  Shield,
  Sparkles,
  Flame,
  Award,
  ArrowRight,
  Users,
  BarChart3,
} from "lucide-react";

interface LeaderboardUser {
  id: number;
  name: string;
  points: number;
  avatar: string;
  rank: number;
  change?: "up" | "down" | "same";
  streak?: number;
}

const topUsers: LeaderboardUser[] = [
  {
    id: 2,
    name: "Ben Smith",
    points: 2030,
    avatar: "/media/avatars/Ellipse4.png",
    rank: 2,
    change: "up",
    streak: 5,
  },
  {
    id: 1,
    name: "Sophia Carter",
    points: 7200,
    avatar: "/media/avatars/Ellipse6.png",
    rank: 1,
    change: "same",
    streak: 12,
  },
  {
    id: 3,
    name: "James Thompson",
    points: 2200,
    avatar: "/media/avatars/Ellipse5.png",
    rank: 3,
    change: "down",
    streak: 3,
  },
];

const otherUsers: LeaderboardUser[] = Array(7)
  .fill(null)
  .map((_, i) => ({
    id: i + 4,
    name: `User ${i + 4}`,
    points: 2100 - i * 150,
    avatar: "/media/avatars/Ellipse7.png",
    rank: i + 4,
    change: i % 3 === 0 ? "up" : i % 3 === 1 ? "down" : "same",
    streak: Math.floor(Math.random() * 7) + 1,
  }));

export default function LeaderboardPage() {
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "allTime">(
    "weekly"
  );

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Get medal color based on rank
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "#4CAF50"; // Green
      case 2:
        return "#2196F3"; // Blue
      case 3:
        return "#FF9800"; // Orange
      default:
        return "#64748b"; // Slate
    }
  };

  // Get trophy icon based on rank
  const getTrophyIcon = (rank: number, className = "") => {
    switch (rank) {
      case 1:
        return (
          <Crown className={className} style={{ color: getMedalColor(1) }} />
        );
      case 2:
        return (
          <Trophy className={className} style={{ color: getMedalColor(2) }} />
        );
      case 3:
        return (
          <Medal className={className} style={{ color: getMedalColor(3) }} />
        );
      default:
        return (
          <Star className={className} style={{ color: getMedalColor(4) }} />
        );
    }
  };

  return (
    <main className="flex flex-col bg-background items-center min-h-screen pb-16 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-purple-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-t from-blue-500/5 to-transparent rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="w-full max-w-4xl pt-14 space-y-12 px-4 relative z-10">
        {/* Page Title */}
        <div className="flex flex-col gap-2">
          <div className="text-2xl font-bold ">Leaderboard</div>
          <p className="font-fragment-mono text-sm text-secondary-foreground">
            See how you are doing in comparison to others
          </p>
        </div>

        {/* Stats Cards - already commented out, keeping as is */}

        {/* Your Rank Card - replacing motion.div with regular div */}
        <div className="relative mb-20">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-green-500/20 to-orange-500/20 blur-xl opacity-50 rounded-xl"></div>
          <Card className="relative overflow-hidden bg-card/80 backdrop-blur-sm border-2 border-divider rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-500/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="text-2xl font-bold text-foreground relative z-10">
                      #4
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                    <ChevronUp size={14} />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Your Rank
                  </h2>
                  <p className="text-secondary-foreground">
                    Top 40% of all users
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-accent/50 px-6 py-3 rounded-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Shield className="text-blue-500 h-6 w-6 relative z-10" />
                <div className="relative z-10">
                  <p className="text-foreground font-medium">1,950 points</p>
                  <div className="flex items-center gap-2">
                    <div className="w-full bg-accent/70 h-1.5 rounded-full mt-1">
                      <div
                        className="bg-blue-500 h-full rounded-full"
                        style={{ width: "80%" }}
                      ></div>
                    </div>
                    <p className="text-xs text-secondary-foreground whitespace-nowrap">
                      50 pts to rank 3
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Top 3 Podium - keeping as is since it doesn't use motion.div */}
        <div className="relative">
          {/* Decorative elements */}
          <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-green-500/5 to-transparent rounded-t-3xl"></div>
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/80 to-transparent"></div>

          <div className="relative z-10">
            <div className="flex justify-center items-end h-[340px] pt-16">
              {topUsers.map((user) => {
                const height =
                  user.rank === 1 ? "h-64" : user.rank === 2 ? "h-52" : "h-40";
                const order =
                  user.rank === 1
                    ? "order-2"
                    : user.rank === 2
                    ? "order-1"
                    : "order-3";
                const avatarSize = user.rank === 1 ? "h-24 w-24" : "h-20 w-20";
                const delay =
                  user.rank === 1
                    ? "delay-300"
                    : user.rank === 2
                    ? "delay-100"
                    : "delay-500";
                const translateY = animate ? "translate-y-0" : "translate-y-20";
                const opacity = animate ? "opacity-100" : "opacity-0";

                return (
                  <div
                    key={user.id}
                    className={`flex flex-col items-center px-2 ${order} transition-all duration-700 ${delay} ${translateY} ${opacity}`}
                    style={{ width: "140px" }}
                  >
                    <div className="w-full flex flex-col items-center">
                      <div className="relative mb-4 group">
                        <div
                          className={`${avatarSize} rounded-full bg-accent border-4 relative overflow-hidden transition-transform duration-300 group-hover:scale-105`}
                          // style={{ borderColor: getMedalColor(user.rank) }}
                        >
                          <div className="absolute inset-0 rounded-full overflow-hidden flex items-center justify-center">
                            <img
                              src={user.avatar || "/placeholder.svg"}
                              alt={user.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        {user.rank === 1 && (
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 ">
                            <span className="text-4xl">👑</span>
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-card rounded-full p-1 border-2 border-divider">
                          {/* {getTrophyIcon(user.rank, "h-5 w-5")} */}
                        </div>

                        {/* Sparkle effects for first place */}
                        {user.rank === 1 && (
                          <>
                            <div className="absolute -top-2 -left-2 text-yellow-500 animate-pulse">
                              {/* <Sparkles size={16} /> */}
                            </div>
                            <div className="absolute top-1/2 -right-4 text-yellow-500 animate-pulse delay-300">
                              {/* <Sparkles size={16} /> */}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-center mb-4">
                        <p className="font-bold text-foreground whitespace-normal break-words px-2">
                          {user.name}
                        </p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <p className="text-sm font-mono font-medium text-secondary-foreground">
                            {user.points.toLocaleString()} pts
                          </p>
                          {user.streak && (
                            <div className="flex items-center gap-0.5 bg-accent/50 px-1 rounded text-xs">
                              <span>🔥</span>
                              <span>{user.streak}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-full ${height} rounded-t-xl flex items-center justify-center relative overflow-hidden group`}
                        style={{
                          background: `linear-gradient(to top, ${getMedalColor(
                            user.rank
                          )}20, ${getMedalColor(user.rank)}40)`,
                          boxShadow: `0 0 20px ${getMedalColor(user.rank)}30`,
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="relative z-10 flex flex-col items-center">
                          <span
                            className="text-5xl font-bold transition-transform duration-300 group-hover:scale-110"
                            style={{ color: getMedalColor(user.rank) }}
                          >
                            {user.rank}
                          </span>
                          {getTrophyIcon(user.rank, "h-6 w-6 mt-2 opacity-80")}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Other Users */}
        <div className="space-y-3 relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">Ranking</h2>
          </div>

          {otherUsers.map((user, index) => {
            const delay = `delay-${(index + 1) * 100}`;
            const translateX = animate ? "translate-x-0" : "translate-x-10";
            const opacity = animate ? "opacity-100" : "opacity-0";

            return (
              <div key={user.id}>
                <Card
                  className={`px-6 py-4 flex items-center gap-4 border-divider bg-card hover:bg-accent/30 transition-all duration-300 relative overflow-hidden group cursor-pointer`}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{
                      backgroundColor: getMedalColor(
                        user.rank > 3 ? 4 : user.rank
                      ),
                    }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                  <div className="relative z-10 flex items-center w-full">
                    <span className="text-secondary-foreground font-mono w-8 text-center">
                      {user.rank.toString().padStart(2, "0")}
                    </span>

                    <Avatar className="h-10 w-10 bg-accent border-2 border-divider relative overflow-hidden">
                      <AvatarImage
                        src={user.avatar || "/placeholder.svg"}
                        alt={user.name}
                        className="object-cover"
                      />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </Avatar>

                    <div className="flex flex-col gap-1 ml-4">
                      <p className="font-medium text-foreground">{user.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-secondary-foreground font-mono">
                          {user.points.toLocaleString()} points
                        </p>
                        {user.streak && user.streak > 2 && (
                          <div className="flex items-center gap-0.5 bg-accent/50 px-1 rounded text-xs">
                            <span>🔥</span>
                            <span>{user.streak}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="ml-auto flex items-center gap-3">
                      {user.change && (
                        <div
                          className={`flex items-center ${
                            user.change === "up"
                              ? "text-green-500"
                              : user.change === "down"
                              ? "text-orange-500"
                              : "text-secondary-foreground"
                          }`}
                        >
                          {user.change === "up" && <ChevronUp size={16} />}
                          {user.change === "down" && (
                            <ChevronUp size={16} className="rotate-180" />
                          )}
                          {user.change === "same" && (
                            <span className="text-xs">-</span>
                          )}
                        </div>
                      )}

                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-accent/50 group-hover:bg-accent transition-colors duration-300">
                        {getTrophyIcon(
                          user.rank > 3 ? 4 : user.rank,
                          "h-4 w-4"
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            );
          })}

          {/* Show more button */}
          <Button
            variant="outline"
            className="w-full py-6 mt-4 border-2 border-dashed border-divider rounded-lg text-secondary-foreground hover:text-foreground hover:border-blue-500/50 transition-colors duration-300 group"
          >
            <span>Show more</span>
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </Button>
        </div>

        {/* Achievement badges section - already commented out, keeping as is */}
      </div>
    </main>
  );
}
