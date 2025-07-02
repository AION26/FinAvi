import React from "react";
import { Badge } from "@/components/ui/badge";      // Update path if needed
import { Progress } from "@/components/ui/progress"; // Update path if needed

interface RiskIndicatorProps {
  title: string;
  score: number;
  description: string;
  severity: "low" | "medium" | "high";
}

// Helper Component
const RiskIndicator = ({ title, score, description, severity }: RiskIndicatorProps) => {
  const severityClasses = {
    low: "bg-green-100 text-green-800",
    medium: "bg-yellow-100 text-yellow-800",
    high: "bg-red-100 text-red-800"
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        <Badge className={`${severityClasses[severity]} text-xs`}>
          {severity.charAt(0).toUpperCase() + severity.slice(1)}
        </Badge>
      </div>
      <Progress 
        value={score * 10} 
        className="h-2"
        indicatorClassName={severityClasses[severity].split(' ')[0]} // just bg color
      />
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default RiskIndicator;
