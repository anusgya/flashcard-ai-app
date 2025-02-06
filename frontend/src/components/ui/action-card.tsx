import { cn } from "@/lib/utils";

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

export function ActionCard({
  icon,
  title,
  description,
  color,
}: ActionCardProps) {
  return (
    <div className="py-3 px-4 rounded-lg border border-b-[3px] border-border hover:bg-secondary   transition-colors cursor-pointer">
      <div className="flex items-start gap-4">
        <div className={cn(" rounded-lg", color)}>{icon}</div>
        <div className="space-y-1">
          <h3 className="text-md font-medium text-card-foreground">{title}</h3>
          <p className="text-secondary-foreground text-xs ">{description}</p>
        </div>
      </div>
    </div>
  );
}
