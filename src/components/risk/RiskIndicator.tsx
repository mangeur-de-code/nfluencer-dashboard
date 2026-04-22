import React from "react";
import { getRiskLevel, type RiskScore, RiskLevel } from "../../types/risk";

interface RiskIndicatorProps {
  score: RiskScore;
  size?: "xs" | "sm" | "md";
  showTooltip?: boolean;
  className?: string;
}

/**
 * Compact risk indicator for use in tables, lists, and inline displays
 * Shows a colored circle and optional score number
 * Color scheme: Green (minimal) → Blue (low) → Yellow (medium) → Orange (high) → Red (critical)
 */
const RiskIndicator: React.FC<RiskIndicatorProps> = ({
  score,
  size = "sm",
  showTooltip = true,
  className = "",
}) => {
  const level = getRiskLevel(score);

  // Color mapping
  const colorMap: Record<RiskLevel, string> = {
    [RiskLevel.MINIMAL]: "bg-green-500",
    [RiskLevel.LOW]: "bg-blue-500",
    [RiskLevel.MEDIUM]: "bg-amber-500",
    [RiskLevel.HIGH]: "bg-orange-500",
    [RiskLevel.CRITICAL]: "bg-red-500",
  };

  const sizeMap = {
    xs: "w-4 h-4",
    sm: "w-6 h-6",
    md: "w-8 h-8",
  };

  const textSizeMap = {
    xs: "text-[0.5rem]",
    sm: "text-xs",
    md: "text-sm",
  };

  const labelMap: Record<RiskLevel, string> = {
    [RiskLevel.MINIMAL]: "Minimal",
    [RiskLevel.LOW]: "Low",
    [RiskLevel.MEDIUM]: "Medium",
    [RiskLevel.HIGH]: "High",
    [RiskLevel.CRITICAL]: "Critical",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full ${colorMap[level]} ${sizeMap[size]} ${textSizeMap[size]} text-white font-bold flex-shrink-0 ${className}`}
      title={showTooltip ? `Risk: ${score}/100 (${labelMap[level]})` : undefined}
    >
      {score}
    </div>
  );
};

export default RiskIndicator;
