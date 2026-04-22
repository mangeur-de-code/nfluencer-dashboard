import React from "react";
import { getRiskLevel, type RiskScore, RiskLevel } from "../../types/risk";

interface RiskScoreBadgeProps {
  score: RiskScore;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Visual badge displaying risk score (0-100) with color coding
 * - Minimal (0-20): Green
 * - Low (20-40): Blue
 * - Medium (40-60): Yellow/Amber
 * - High (60-80): Orange
 * - Critical (80-100): Red
 */
const RiskScoreBadge: React.FC<RiskScoreBadgeProps> = ({
  score,
  showLabel = true,
  size = "md",
  className = "",
}) => {
  const level = getRiskLevel(score);

  // Color mapping based on risk level
  const colorMap: Record<RiskLevel, { bg: string; text: string; border: string }> = {
    [RiskLevel.MINIMAL]: {
      bg: "bg-green-50 dark:bg-green-900/20",
      text: "text-green-700 dark:text-green-400",
      border: "border-green-200 dark:border-green-800",
    },
    [RiskLevel.LOW]: {
      bg: "bg-blue-50 dark:bg-blue-900/20",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-200 dark:border-blue-800",
    },
    [RiskLevel.MEDIUM]: {
      bg: "bg-amber-50 dark:bg-amber-900/20",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-200 dark:border-amber-800",
    },
    [RiskLevel.HIGH]: {
      bg: "bg-orange-50 dark:bg-orange-900/20",
      text: "text-orange-700 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
    },
    [RiskLevel.CRITICAL]: {
      bg: "bg-red-50 dark:bg-red-900/20",
      text: "text-red-700 dark:text-red-400",
      border: "border-red-200 dark:border-red-800",
    },
  };

  const colors = colorMap[level];

  const sizeMap = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };

  const sizeClass = sizeMap[size];

  const labelMap: Record<RiskLevel, string> = {
    [RiskLevel.MINIMAL]: "Minimal",
    [RiskLevel.LOW]: "Low",
    [RiskLevel.MEDIUM]: "Medium",
    [RiskLevel.HIGH]: "High",
    [RiskLevel.CRITICAL]: "Critical",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${colors.bg} ${colors.border} ${sizeClass} ${colors.text} font-medium ${className}`}
      title={`Risk Score: ${score}/100 - ${labelMap[level]} Risk`}
    >
      {/* Risk score circle indicator */}
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/40 dark:bg-white/10">
        <span className="text-xs font-bold">{score}</span>
      </div>

      {/* Label */}
      {showLabel && (
        <span className="font-semibold">{labelMap[level]}</span>
      )}
    </div>
  );
};

export default RiskScoreBadge;
