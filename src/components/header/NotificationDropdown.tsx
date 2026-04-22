import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useAdminFetch } from "../../lib/adminApi";

type AdminNotification = {
  id: string;
  type: "report" | "verification" | "payout";
  title: string;
  body: string;
  createdAt: string;
  href: string;
};

type NotificationsData = {
  counts: {
    openReports: number;
    pendingVerifications: number;
    pendingPayouts: number;
    pendingPayoutAmount: number;
  };
  hasAlerts: boolean;
  notifications: AdminNotification[];
};

const TYPE_COLORS: Record<AdminNotification["type"], string> = {
  report: "bg-red-500",
  verification: "bg-blue-500",
  payout: "bg-yellow-500",
};

const TYPE_LABELS: Record<AdminNotification["type"], string> = {
  report: "Report",
  verification: "Verification",
  payout: "Payout",
};

/** Parse a date string that may be ISO-8601 or SQLite "YYYY-MM-DD HH:MM:SS".
 *  Normalising before calling `new Date()` avoids Safari returning Invalid Date
 *  for the space-separated SQLite format. */
function parseDate(dateStr: string): Date {
  if (dateStr.includes("T")) return new Date(dateStr);
  // Convert SQLite "YYYY-MM-DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SSZ"
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - parseDate(dateStr).getTime();
  if (Number.isNaN(diff)) return "—";
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} day ago`;
}

export default function NotificationDropdown() {
  const fetchAdmin = useAdminFetch();
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<NotificationsData | null>(null);
  const [seen, setSeen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const result = await fetchAdmin<NotificationsData>("/api/admin/notifications");
        setData(result);
      } catch {
        setData(null);
      }
    };
    load();
    // Poll every 30 seconds for real-time feel without WebSockets
    intervalRef.current = setInterval(load, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchAdmin]);

  const hasAlerts = !seen && (data?.hasAlerts ?? false);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
    setSeen(true);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const notifications = data?.notifications ?? [];
  const counts = data?.counts;

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {hasAlerts && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Admin Alerts
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg
              className="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        {counts && (counts.openReports > 0 || counts.pendingVerifications > 0 || counts.pendingPayouts > 0) && (
          <div className="mb-3 flex flex-wrap gap-2">
            {counts.openReports > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                {counts.openReports} report{counts.openReports !== 1 ? "s" : ""}
              </span>
            )}
            {counts.pendingVerifications > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                {counts.pendingVerifications} verification{counts.pendingVerifications !== 1 ? "s" : ""}
              </span>
            )}
            {counts.pendingPayouts > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                {counts.pendingPayouts} payout{counts.pendingPayouts !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {notifications.length === 0 ? (
            <li className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
              No pending alerts
            </li>
          ) : (
            notifications.map((n) => (
              <li key={n.id}>
                <DropdownItem
                  onItemClick={closeDropdown}
                  tag="a"
                  to={n.href}
                  className="flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5"
                >
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <span
                      className={`absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${TYPE_COLORS[n.type]}`}
                    />
                    <svg className="h-5 w-5 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                    </svg>
                  </span>
                  <span className="block min-w-0 flex-1">
                    <span className="mb-0.5 flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {TYPE_LABELS[n.type]}
                      </span>
                    </span>
                    <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-xs text-gray-400 dark:text-gray-500">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                </DropdownItem>
              </li>
            ))
          )}
        </ul>

        <Link
          to="/moderation"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          View Moderation Queue
        </Link>
      </Dropdown>
    </div>
  );
}
