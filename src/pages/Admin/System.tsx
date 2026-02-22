import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import StatCard from "../../components/admin/StatCard";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";
import { BoltIcon } from "../../icons";

type SystemData = {
  metrics: {
    apiErrorRate: number;
    webhookFailures: number;
    workerLatencyMs: number;
    dbLatencyP95Ms: number;
    jobFailures: number;
    emailFailures: number;
  };
};

const fallback: SystemData = {
  metrics: {
    apiErrorRate: 0,
    webhookFailures: 0,
    workerLatencyMs: 0,
    dbLatencyP95Ms: 0,
    jobFailures: 0,
    emailFailures: 0,
  },
};

export default function System() {
  const { range } = useAdminDateRange();
  const [data, setData] = useState<SystemData>(fallback);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<SystemData>("/api/admin/system", {
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

  return (
    <>
      <PageMeta title="Admin System" description="System health and stability" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          System Health
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="API Error Rate"
          value={`${metrics.apiErrorRate.toFixed(2)}%`}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Webhook Failures"
          value={metrics.webhookFailures}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Worker Latency (ms)"
          value={metrics.workerLatencyMs}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="DB Latency p95 (ms)"
          value={metrics.dbLatencyP95Ms}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Background Job Failures"
          value={metrics.jobFailures}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
        <StatCard
          label="Email Failures"
          value={metrics.emailFailures}
          icon={<BoltIcon className="text-gray-800 size-6 dark:text-white/90" />}
        />
      </div>

      <div className="mt-6">
        <SectionCard
          title="System Notes"
          subtitle={
            status === "error"
              ? "Live data unavailable."
              : "Connect to logs/metrics provider for real-time monitoring."
          }
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aggregate error rates, worker latency, and webhook failures from your
            observability stack, then feed into this endpoint.
          </p>
        </SectionCard>
      </div>
    </>
  );
}
