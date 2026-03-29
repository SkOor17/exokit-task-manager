import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description: string;
  color: "destructive" | "primary" | "warning" | "success";
}

export function StatCard({ title, value, icon, description, color }: StatCardProps) {
  const colorClasses = {
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    primary: "bg-primary/10 text-primary border-primary/20",
    warning: "bg-orange-100 text-orange-700 border-orange-200",
    success: "bg-green-100 text-green-700 border-green-200",
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-2 rounded-lg border", colorClasses[color])}>
            {icon}
          </div>
          <Badge variant="outline" className="text-[10px] font-bold opacity-60">
            {description}
          </Badge>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="text-2xl font-bold text-foreground mt-1">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
