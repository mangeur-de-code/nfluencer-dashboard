import { useCallback, useEffect, useState } from "react";
import { fetchAdmin } from "../lib/adminApi";

export type SavedFilter = {
    id: number;
    page: string;
    name: string;
    filterJson: string;
    isDefault: boolean;
    createdAt: string;
};

export type SlaConfig = {
    severity: string;
    target_hours: number;
    warning_hours: number;
};

const STORAGE_KEY = "admin_local_filters";

/** Read local filter overrides from localStorage (fallback when API is unavailable). */
function readLocal(page: string): Record<string, string> {
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY}_${page}`);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/** Persist filter state to localStorage for the current page. */
export function saveLocalFilter(page: string, key: string, value: string) {
    try {
        const existing = readLocal(page);
        localStorage.setItem(`${STORAGE_KEY}_${page}`, JSON.stringify({ ...existing, [key]: value }));
    } catch {
        // storage quota exceeded — silently ignore
    }
}

/** Read a single persisted filter value (from localStorage). */
export function readLocalFilter(page: string, key: string, defaultValue: string): string {
    try {
        const stored = readLocal(page);
        return stored[key] ?? defaultValue;
    } catch {
        return defaultValue;
    }
}

/** Hook to load and manage server-side saved filters for a given admin page. */
export function useSavedFilters(page: string) {
    const [filters, setFilters] = useState<SavedFilter[]>([]);
    const [slaConfig, setSlaConfig] = useState<SlaConfig[]>([]);
    const [adminRole, setAdminRole] = useState<string>("super_admin");

    const load = useCallback(async () => {
        try {
            const data = await fetchAdmin<{
                filters: SavedFilter[];
                slaConfig: SlaConfig[];
                adminRole: string;
            }>("/api/admin/preferences", { page });
            setFilters(data.filters);
            setSlaConfig(data.slaConfig);
            setAdminRole(data.adminRole);
        } catch {
            // API might not be accessible yet — leave defaults
        }
    }, [page]);

    useEffect(() => { load(); }, [load]);

    async function saveFilter(name: string, filterJson: string, isDefault = false) {
        try {
            await fetch("/api/admin/preferences", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ page, name, filter_json: filterJson, is_default: isDefault }),
            });
            await load();
        } catch {
            // Silently store locally as fallback
        }
    }

    async function deleteFilter(id: number) {
        try {
            await fetch("/api/admin/preferences", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, _delete: true }),
            });
            await load();
        } catch { }
    }

    return { filters, slaConfig, adminRole, saveFilter, deleteFilter, reload: load };
}

/** Determine SLA urgency for a report/flag based on age and config. */
export function getSlaStatus(
    createdAt: string,
    severity: string,
    config: SlaConfig[]
): "ok" | "warning" | "breach" {
    const rule = config.find((c) => c.severity === severity);
    if (!rule) return "ok";
    const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
    if (ageHours >= rule.target_hours) return "breach";
    if (ageHours >= rule.warning_hours) return "warning";
    return "ok";
}

/** Format hours as a human-readable duration string. */
export function formatAge(createdAt: string): string {
    const mins = Math.round((Date.now() - new Date(createdAt).getTime()) / 60_000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
}

export const SLA_COLORS: Record<"ok" | "warning" | "breach", string> = {
    ok: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    breach: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};
