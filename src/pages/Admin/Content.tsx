import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";
import DonutChart from "../../components/admin/charts/DonutChart";
import { fetchAdmin } from "../../lib/adminApi";
import { useAdminDateRange } from "../../context/AdminDateRangeContext";


type ContentSummary = {
  mix: Array<{ label: string; value: number }>;
  topContent: Array<{ title: string; type: string; views: number; likes: number }>;
};

export default function Content() {
  const { range } = useAdminDateRange();
  const [data, setData] = useState<ContentSummary>({ mix: [], topContent: [] });
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setStatus("loading");
      try {
        const response = await fetchAdmin<ContentSummary>(
          "/api/admin/content",
          {
            start: range.start,
            end: range.end,
            range: range.key,
          }
        );
        if (isMounted) {
          setData(response);
          setStatus("ready");
        }
      } catch (error) {
        if (isMounted) {
          setData({ mix: [], topContent: [] });
          setStatus("error");
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [range]);

  const labels = useMemo(() => data.mix.map((item) => item.label), [data.mix]);
  const series = useMemo(() => data.mix.map((item) => item.value), [data.mix]);

  return (
    <>
      <PageMeta title="Admin Content" description="Content supply & engagement" />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
          Content & Engagement
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {range.label} • {range.start} → {range.end}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard title="Content Mix" subtitle="Posts by type">
          {series.some((value) => value > 0) ? (
            <DonutChart labels={labels} series={series} />
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {status === "loading"
                ? "Loading content mix..."
                : "No content mix data yet."}
            </div>
          )}
        </SectionCard>
        <SectionCard title="Top Content" subtitle="Most engaged posts">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-gray-200 text-left text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Likes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.topContent.map((item, index) => (
                  <tr key={`${item.title}-${index}`}>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {item.title}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.type}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.views}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                      {item.likes}
                    </td>
                  </tr>
                ))}
                {data.topContent.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-6 text-center text-gray-500 dark:text-gray-400"
                    >
                      {status === "loading"
                        ? "Loading content..."
                        : "No content found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
