import React, { createContext, useContext, useMemo, useState } from "react";

export type DateRangeKey = "7d" | "30d" | "90d" | "1y";

const RANGE_OPTIONS: Record<DateRangeKey, { label: string; days: number }> = {
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  "90d": { label: "Last 90 days", days: 90 },
  "1y": { label: "Last 12 months", days: 365 },
};

export type DateRange = {
  key: DateRangeKey;
  label: string;
  start: string;
  end: string;
};

const AdminDateRangeContext = createContext<{
  rangeKey: DateRangeKey;
  range: DateRange;
  setRangeKey: (key: DateRangeKey) => void;
  options: Array<{ key: DateRangeKey; label: string }>;
} | null>(null);

const getRange = (key: DateRangeKey): DateRange => {
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - RANGE_OPTIONS[key].days + 1);

  const start = startDate.toISOString().split("T")[0];
  const end = endDate.toISOString().split("T")[0];

  return {
    key,
    label: RANGE_OPTIONS[key].label,
    start,
    end,
  };
};

export const AdminDateRangeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [rangeKey, setRangeKey] = useState<DateRangeKey>("30d");

  const range = useMemo(() => getRange(rangeKey), [rangeKey]);

  const options = useMemo(
    () =>
      (Object.keys(RANGE_OPTIONS) as DateRangeKey[]).map((key) => ({
        key,
        label: RANGE_OPTIONS[key].label,
      })),
    []
  );

  return (
    <AdminDateRangeContext.Provider
      value={{ rangeKey, range, setRangeKey, options }}
    >
      {children}
    </AdminDateRangeContext.Provider>
  );
};

export const useAdminDateRange = () => {
  const context = useContext(AdminDateRangeContext);
  if (!context) {
    throw new Error("useAdminDateRange must be used within AdminDateRangeProvider");
  }
  return context;
};
