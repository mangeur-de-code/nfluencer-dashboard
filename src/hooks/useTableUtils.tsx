import { useMemo, useState } from "react";

export type SortDirection = "asc" | "desc" | null;

export type SortState<K extends string> = {
    key: K | null;
    dir: SortDirection;
};

export function useSortedPaginatedData<T extends Record<string, unknown>>(
    data: T[],
    pageSize = 25
) {
    const [sort, setSort] = useState<SortState<string>>({ key: null, dir: null });
    const [page, setPage] = useState(1);

    const sorted = useMemo(() => {
        if (!sort.key || !sort.dir) return data;
        const key = sort.key;
        return [...data].sort((a, b) => {
            const av = a[key] ?? "";
            const bv = b[key] ?? "";
            const cmp =
                typeof av === "number" && typeof bv === "number"
                    ? av - bv
                    : String(av).localeCompare(String(bv), undefined, { numeric: true });
            return sort.dir === "asc" ? cmp : -cmp;
        });
    }, [data, sort]);

    const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

    function toggleSort(key: string) {
        setSort((prev) => {
            if (prev.key !== key) return { key, dir: "asc" };
            if (prev.dir === "asc") return { key, dir: "desc" };
            return { key: null, dir: null };
        });
        setPage(1);
    }

    function resetPage() {
        setPage(1);
    }

    return { sorted: paged, totalPages, page: safePage, setPage, sort, toggleSort, resetPage, totalCount: sorted.length };
}

export function SortIcon({ active, dir }: { active: boolean; dir: SortDirection }) {
    if (!active || !dir) {
        return (
            <svg className="ml-1 inline-block h-3.5 w-3.5 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 9l6-6 6 6H6zm12 6l-6 6-6-6h12z" />
            </svg>
        );
    }
    return dir === "asc" ? (
        <svg className="ml-1 inline-block h-3.5 w-3.5 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3l8 8H4z" />
        </svg>
    ) : (
        <svg className="ml-1 inline-block h-3.5 w-3.5 text-brand-500" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 21l-8-8h16z" />
        </svg>
    );
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return;
    const keys = Object.keys(rows[0]);
    const header = keys.join(",");
    const body = rows
        .map((row) =>
            keys.map((k) => {
                const v = row[k] ?? "";
                const str = String(v).replace(/"/g, '""');
                return str.includes(",") || str.includes('"') || str.includes("\n")
                    ? `"${str}"`
                    : str;
            }).join(",")
        )
        .join("\n");
    const csv = `${header}\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
