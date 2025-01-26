// app/leaderboard/page.tsx
"use client";

import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";

interface LeaderboardUser {
  id: number;
  name: string;
  points: number;
  avatar: string;
  rank: number;
}

const topUsers: LeaderboardUser[] = [
  {
    id: 2,
    name: "Ben Smith",
    points: 2030,
    avatar: "/placeholder.svg?height=40&width=40",
    rank: 2,
  },
  {
    id: 1,
    name: "Sophia Carter",
    points: 7200,
    avatar: "/placeholder.svg?height=40&width=40",
    rank: 1,
  },
  {
    id: 3,
    name: "James Thompson",
    points: 2200,
    avatar: "/placeholder.svg?height=40&width=40",
    rank: 3,
  },
];

const otherUsers: LeaderboardUser[] = Array(5)
  .fill(null)
  .map((_, i) => ({
    id: i + 4,
    name: "Emily Johnson",
    points: 2100,
    avatar: "/placeholder.svg?height=40&width=40",
    rank: i + 4,
  }));

export default function LeaderboardPage() {
  return (
    <main className="flex flex-col bg-background items-center">
      <div className="pt-14 space-y-8">
        <div className="bg-card text-primary-blue-DEFAULT rounded-lg px-6 py-3 border border-border inline-flex items-center gap-3">
          <span className="text-md font-semibold px-2 py-1 bg-primary-blue rounded-md text-muted font-fragment-mono">
            #4
          </span>
          <span className="text-foreground ">
            You are doing better than 40% of the users!
          </span>
        </div>

        <div className="flex justify-center p-8 rounded-lg">
          <div className="flex items-end">
            {topUsers.map((user) => {
              const height =
                user.rank === 1 ? "h-32" : user.rank === 2 ? "h-24" : "h-16";
              const order =
                user.rank === 1
                  ? "order-2"
                  : user.rank === 2
                  ? "order-1"
                  : "order-3";
              const avatarSize = user.rank === 1 ? "h-20 w-20" : "h-16 w-16";

              return (
                <div
                  key={user.id}
                  className="flex flex-col items-center"
                  style={{ width: "120px" }}
                >
                  <div className={`w-full flex flex-col items-center ${order}`}>
                    <div className="relative mb-4">
                      <div
                        className={`${avatarSize} rounded-full bg-muted-foreground`}
                      />
                      {user.rank === 1 && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="text-3xl">👑</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center mb-4">
                      <p className="font-medium text-sm whitespace-normal break-words px-2">
                        {user.name}
                      </p>
                      <p className="text-xs text-secondary-foreground mt-1 font-fragment-mono">
                        {user.points} points
                      </p>
                    </div>
                    <div
                      className={`w-20 ${height} bg-card  bg-gradient-to-b from-[#21231E] to-[#1C1D19] rounded-t-lg flex items-center justify-center`}
                    >
                      <span
                        className={`text-4xl font-bold ${
                          user.rank === 1
                            ? "text-primary-green-DEFAULT"
                            : user.rank === 2
                            ? "text-primary-blue-DEFAULT"
                            : "text-primary-orange-DEFAULT"
                        }`}
                      >
                        {user.rank}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          {otherUsers.map((user) => (
            <Card
              key={user.id}
              className="px-6 py-4 flex items-center gap-4 border-divider border-2 bg-muted"
            >
              <span className="text-secondary-foreground font-fragment-mono w-8">
                {user.rank.toString().padStart(2, "0")}
              </span>
              <Avatar className="h-10 w-10 bg-secondary">
                {/* <img
                  src={user.avatar || "/placeholder.svg"}
                  alt={user.name}
                  className="object-cover"
                /> */}
              </Avatar>
              <div className="flex flex-col gap-1">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-secondary-foreground font-fragment-mono">
                  {user.points} points
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
