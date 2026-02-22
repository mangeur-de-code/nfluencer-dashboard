export type AdminApiError = {
  message: string;
  status?: number;
};

const getBaseUrl = () => {
  // In development, use relative URLs so Vite proxy handles routing to the main app
  // In production, use absolute URL if provided in env
  const envBase = import.meta.env.VITE_ADMIN_API_BASE_URL as string | undefined;
  if (envBase && (import.meta.env.PROD || envBase !== "http://localhost:5173")) {
    return envBase.replace(/\/$/, "");
  }
  // Use relative URLs to leverage Vite proxy -> no CORS issues
  return "";
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
