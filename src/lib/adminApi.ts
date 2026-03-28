export type AdminApiError = {
  message: string;
  status?: number;
};

const getBaseUrl = () => {
  // In production, VITE_ADMIN_API_BASE_URL must point to the admin microservice
  // e.g. https://api-admin.nfluencer.co
  const envBase = import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined;
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }
  // In development, the admin service runs via `wrangler dev` on port 8788
  return "http://localhost:8788";
};

const toQueryString = (params?: Record<string, string | number | undefined>) => {
  if (!params) return "";
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join("&");
  return query ? `?${query}` : "";
};

export const fetchAdmin = async <T>(
  path: string,
  params?: Record<string, string | number | undefined>
): Promise<T> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}${path}${toQueryString(params)}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    const error: AdminApiError = {
      message: message || "Failed to fetch admin data",
      status: response.status,
    };
    throw error;
  }

  return (await response.json()) as T;
};
