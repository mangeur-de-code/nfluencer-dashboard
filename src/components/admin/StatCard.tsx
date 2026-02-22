import React from "react";
import Badge from "../ui/badge/Badge";

type StatCardProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  delta?: string;
  trend?: "up" | "down" | "flat";
  helper?: string;
};

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  delta,
  trend,
  helper,
}) => {
  const badgeColor = trend === "down" ? "error" : trend === "up" ? "success" : "info";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          {icon}
        </div>
        {delta ? (
          <Badge color={badgeColor}>
            {delta}
          </Badge>
        ) : null}
      </div>
      <div className="mt-5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
          {value}
        </h4>
        {helper ? (
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{helper}</p>
        ) : null}
      </div>
    </div>
  );
};

export default StatCard;
