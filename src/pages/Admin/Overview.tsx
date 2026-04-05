import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import StatCard from "../../components/admin/StatCard";
import SectionCard from "../../components/admin/SectionCard";
import AreaChart from "../../components/admin/charts/AreaChart";
import BarChart from "../../components/admin/charts/BarChart";
import DonutChart from "../../components/admin/charts/DonutChart";
import { useAdminFetch } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import {
  AlertHexaIcon,
  DollarLineIcon,
  FileIcon,
  GroupIcon,
  PieChartIcon,
  UserCircleIcon,
  VideoIcon,
} from "../../icons";

type OverviewData = {
  range?: { start: string; end: string };
  kpis?: {
    totalUsers: number;
    newUsers: number;
    activeUsers7d: number;
    activeUsers30d: number;
    activeCreators: number;
    activeSubscribers: number;
    mrr: number;
    netRevenue: number;
    pendingPayouts: number;
    openReports: number;
    flaggedContent: number;
    liveStreams: number;
  };
  series?: {
    userGrowth: Array<{ date: string; count: number }>;
    revenue: Array<{ date: string; amount: number }>;
    churn: Array<{ date: string; value: number }>;
    contentMix: Array<{ label: string; value: number }>;
  };
  analytics?: {
    totalMinutesViewed: number;
    topCountries: Array<{ country: string; minutesViewed: number }>;
    analyticsByDate: Array<{ date: string; minutesViewed: number }>;
    topVideos: Array<{ videoUid: string; minutesViewed: number }>;
    topCreators: Array<{ creatorId: string; minutesViewed: number; videoCount: number; topCountry?: string }>;
  };
};

const fallbackData: OverviewData = {
  kpis: {
    totalUsers: 0,
    newUsers: 0,
    activeUsers7d: 0,
    activeUsers30d: 0,
    activeCreators: 0,
    activeSubscribers: 0,
    mrr: 0,
    netRevenue: 0,
    pendingPayouts: 0,
    openReports: 0,
    flaggedContent: 0,
    liveStreams: 0,
  },
  series: {
    userGrowth: [],
    revenue: [],
    churn: [],
    contentMix: [
      { label: "Photo", value: 0 },
      { label: "Video", value: 0 },
      { label: "Audio", value: 0 },
      { label: "Text", value: 0 },
    ],
  },
  analytics: {
    totalMinutesViewed: 0,
    topCountries: [],
    analyticsByDate: [],
    topVideos: [],
    topCreators: [],
  },
};

export default function Overview() {
  const adminFetch = useAdminFetch();
  const { range } = useAdminDateRange();
  const [data, setData] = useState<OverviewData>(fallbackData);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await adminFetch<OverviewData>("/api/admin/overview", {
          start: range.start,
          end: range.end,
          range: range.key,
        });
        if (isMounted) {
          setData({ ...fallbackData, ...response });
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setData(fallbackData);
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const userGrowthCategories = useMemo(
    () => data.series?.userGrowth.map((item) => item.date) || [],
    [data.series?.userGrowth]
  );

  const userGrowthSeries = useMemo(
    () => [
      {
        name: "Users",
        data: data.series?.userGrowth.map((item) => item.count) || [],
      },
    ],
    [data.series?.userGrowth]
  );

  const revenueCategories = useMemo(
    () => data.series?.revenue.map((item) => item.date) || [],
    [data.series?.revenue]
  );

  const revenueSeries = useMemo(
    () => [
      {
        name: "Revenue",
        data: data.series?.revenue.map((item) => item.amount) || [],
      },
    ],
    [data.series?.revenue]
  );

  const churnSeries = useMemo(
    () => [
      {
        name: "Churn",
        data: data.series?.churn.map((item) => item.value) || [],
      },
    ],
    [data.series?.churn]
  );

  const churnCategories = useMemo(
    () => data.series?.churn.map((item) => item.date) || [],
    [data.series?.churn]
  );

  const contentLabels = data.series?.contentMix.map((item) => item.label) || [];
  const contentSeries = data.series?.contentMix.map((item) => item.value) || [];

  const kpis = data.kpis || fallbackData.kpis!;

  return (
    <>
      <PageMeta
        title="Admin Overview"
        description="Platform activity, revenue, and moderation overview"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
            Platform Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {range.label} ΓÇó {range.start} ΓåÆ {range.end}
          </p>
        </div>
        {status === "error" ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
            Live data unavailable. Showing placeholders.
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={kpis.totalUsers.toLocaleString()}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="New Users"
          value={kpis.newUsers.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Users (7d)"
          value={kpis.activeUsers7d.toLocaleString()}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Users (30d)"
          value={kpis.activeUsers30d.toLocaleString()}
          icon={<PieChartIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Creators"
          value={kpis.activeCreators.toLocaleString()}
          icon={<GroupIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Active Subscribers"
          value={kpis.activeSubscribers.toLocaleString()}
          icon={<UserCircleIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="MRR"
          value={`$${kpis.mrr.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Net Revenue"
          value={`$${kpis.netRevenue.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Pending Payouts"
          value={`$${kpis.pendingPayouts.toLocaleString()}`}
          icon={<DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Open Reports"
          value={kpis.openReports.toLocaleString()}
          icon={<AlertHexaIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Flagged Content"
          value={kpis.flaggedContent.toLocaleString()}
          icon={<FileIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Live Streams"
          value={kpis.liveStreams.toLocaleString()}
          icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="User Growth"
          subtitle="Daily signups and growth"
        >
          {userGrowthSeries[0].data.length ? (
            <AreaChart categories={userGrowthCategories} series={userGrowthSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No growth data yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Revenue Trend" subtitle="Gross revenue by day">
          {revenueSeries[0].data.length ? (
            <AreaChart categories={revenueCategories} series={revenueSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No revenue data yet.
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Subscription Churn" subtitle="Daily churn counts">
          {churnSeries[0].data.length ? (
            <BarChart categories={churnCategories} series={churnSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No churn data yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Content Mix" subtitle="Posts by type">
          {contentSeries.some((value) => value > 0) ? (
            <DonutChart labels={contentLabels} series={contentSeries} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              No content distribution yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Operational Alerts" subtitle="Moderation queue">
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
            <div className="flex items-center justify-between">
              <span>Open reports</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.openReports}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Flagged content</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.flaggedContent}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Live streams</span>
              <span className="font-semibold text-gray-800 dark:text-white/90">
                {kpis.liveStreams}
              </span>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Stream Analytics Section */}
      <div className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
          Stream Analytics
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Minutes Viewed"
            value={data.analytics?.totalMinutesViewed?.toLocaleString() || "0"}
            icon={<VideoIcon className="text-gray-800 size-6 dark:text-white/90" />}
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Top Countries" subtitle="Minutes viewed by geography">
            {data.analytics?.topCountries && data.analytics.topCountries.length > 0 ? (
              <div className="space-y-2">
                {data.analytics.topCountries.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">{item.country}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(item.minutesViewed /
                                (data.analytics?.topCountries[0]?.minutesViewed || 1)) *
                              100
                              }%`,
                          }}
                        />
                      </div>
                      <span className="w-20 text-right font-semibold text-gray-800 dark:text-white/90">
                        {item.minutesViewed.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No geographic data available yet.
              </div>
            )}
          </SectionCard>

          <SectionCard title="Top Videos" subtitle="Most watched streams">
            {data.analytics?.topVideos && data.analytics.topVideos.length > 0 ? (
              <div className="space-y-2">
                {data.analytics.topVideos.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="truncate text-gray-600 dark:text-gray-300">
                      {item.videoUid.substring(0, 16)}...
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-white/90">
                      {item.minutesViewed.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No video data available yet.
              </div>
            )}
          </SectionCard>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SectionCard title="Top Creators" subtitle="Creators by engagement">
            {data.analytics?.topCreators && data.analytics.topCreators.length > 0 ? (
              <div className="space-y-3">
                {data.analytics.topCreators.map((item, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800 dark:text-white/90">
                          Creator {item.creatorId.substring(0, 8)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {item.videoCount} video{item.videoCount !== 1 ? "s" : ""} ΓÇó {item.topCountry || "Global"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-blue-600 dark:text-blue-400">
                          {(item.minutesViewed / 1000).toFixed(1)}k
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          minutes
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div
                        className="h-full bg-gradient-to-r from-purple-400 to-purple-600"
                        style={{
                          width: `${(item.minutesViewed /
                              (data.analytics?.topCreators[0]?.minutesViewed || 1)) *
                            100
                            }%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No creator data available yet.
              </div>
            )}
          </SectionCard>

          <SectionCard title="Stream Activity Trend" subtitle="Minutes viewed over time">
            {data.analytics?.analyticsByDate && data.analytics.analyticsByDate.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Daily minutes viewed across all streams
                </div>
                <div className="space-y-1">
                  {data.analytics.analyticsByDate.map((item, idx) => {
                    const maxMinutes = Math.max(
                      ...data.analytics!.analyticsByDate.map((d) => d.minutesViewed)
                    );
                    const percentage = (item.minutesViewed / (maxMinutes || 1)) * 100;
                    return (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="w-20 text-gray-600 dark:text-gray-300">
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <div className="flex flex-1 items-center gap-2 px-3">
                          <div className="h-6 flex-1 overflow-hidden rounded bg-gray-100 dark:bg-gray-700">
                            <div
                              className="h-full bg-gradient-to-r from-blue-400 to-blue-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                        <span className="w-24 text-right font-semibold text-gray-800 dark:text-white/90">
                          {item.minutesViewed.toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                No time-series data available yet.
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </>
  );
}
