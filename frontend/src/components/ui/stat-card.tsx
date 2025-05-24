import { ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: ReactNode;
  trend: number;
  additionalInfo?: string;
  showProgress?: boolean;
  progressValue?: number;
  className?: string;
}

export default function StatCard({
  title,
  value,
  unit,
  icon,
  trend,
  additionalInfo,
  showProgress = false,
  progressValue = 0,
  className = "",
}: StatCardProps) {
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
    <Card
      className={`overflow-hidden border-divider hover:border-primary-green/30 transition-all duration-300 group ${className}`}
    >
      <CardContent className="px-3 py-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-green/10 rounded-full group-hover:bg-primary-green/20 transition-colors duration-300">
            {icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-secondary-foreground">
                {title}
              </p>
              {getTrendIndicator(trend)}
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {unit && (
                <p className="text-sm text-secondary-foreground">{unit}</p>
              )}
            </div>
            {additionalInfo && (
              <p className="text-xs text-muted-foreground mt-1">
                {additionalInfo}
              </p>
            )}
          </div>
        </div>
        {showProgress && (
          <div className="mt-4">
            <Progress value={progressValue} className="h-2" />
          </div>
        )}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-green/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
      </CardContent>
    </Card>
  );
}
