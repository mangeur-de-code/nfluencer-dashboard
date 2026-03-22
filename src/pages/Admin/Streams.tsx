import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import StatCard from "../../components/admin/StatCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { VideoIcon } from "../../icons";

type StreamData = {
  metrics: {
    liveNow: number;
    peakViewers: number;
    totalWatchTime: number;
    avgSessionDuration: number;
    streamErrors: number;
    chatMessages: number;
  };
  series?: {
    viewersByDay: Array<{ date: string; viewers: number }>;
    watchTimeByDay: Array<{ date: string; minutes: number }>;
  };
};

const fallback: StreamData = {
  metrics: {
    liveNow: 0,
    peakViewers: 0,
    totalWatchTime: 0,
    avgSessionDuration: 0,
    streamErrors: 0,
    chatMessages: 0,
  },
  series: { viewersByDay: [], watchTimeByDay: [] },
};

export default function Streams() {
  const { range } = useAdminDateRange();
  const [data, setData] = useState<StreamData>(fallback);
  const [_status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<StreamData>("/api/admin/streams", {
          start: range.start,
          end: range.end,
          range: range.key,
        });
        if (isMounted) {
          setData(response);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setData(fallback);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const { metrics } = data;

  const viewerDates = useMemo(
    () => (data.series?.viewersByDay ?? []).map((d) => d.date),
    [data.series]
  );
  const viewerSeries = useMemo(
    () => [{ name: "Unique Viewers", data: (data.series?.viewersByDay ?? []).map((d) => d.viewers) }],
    [data.series]
  );
  const watchDates = useMemo(
    () => (data.series?.watchTimeByDay ?? []).map((d) => d.date),
    [data.series]
  );
  const watchSeries = useMemo(
    () => [{ name: "Watch Time (min)", data: (data.series?.watchTimeByDay ?? []).map((d) => d.minutes) }],
    [data.series]
  );

  return (
    <>
      <PageMeta title="Admin Streams" description="Streaming health" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Live Streams
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Live Now"
          value={metrics.liveNow}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Peak Viewers"
          value={metrics.peakViewers}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Total Watch Time (min)"
          value={metrics.totalWatchTime}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Avg Session (min)"
          value={metrics.avgSessionDuration}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Stream Errors"
          value={metrics.streamErrors}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Chat Messages"
          value={metrics.chatMessages}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Daily Viewers Trend"
          subtitle={viewerDates.length > 0 ? `${viewerDates.length} days` : "No data in range"}
        >
          {viewerDates.length > 0 ? (
            <AreaChart categories={viewerDates} series={viewerSeries} height={240} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No viewer data for the selected range.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Daily Watch Time"
          subtitle={watchDates.length > 0 ? `${watchDates.length} days` : "No data in range"}
        >
          {watchDates.length > 0 ? (
            <AreaChart categories={watchDates} series={watchSeries} height={240} />
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">
              No watch time data for the selected range.
            </p>
          )}
        </SectionCard>
      </div>
    </>
  );
}
