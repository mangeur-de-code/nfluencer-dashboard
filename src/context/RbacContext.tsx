import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchAdmin } from "../lib/adminApi";

export type AdminRole = "super_admin" | "moderator" | "support" | null;

type RbacContextValue = {
    role: AdminRole;
    /** Can perform destructive actions (ban, delete, promote) */
    canModerate: boolean;
    /** Can access all financial data (revenue, payouts, settings) */
    canAccessFinancials: boolean;
    /** Can manage system settings */
    canManageSystem: boolean;
};

const RbacContext = createContext<RbacContextValue>({
    role: null,
    canModerate: true,
    canAccessFinancials: true,
    canManageSystem: true,
});

function derivePermissions(role: AdminRole): Omit<RbacContextValue, "role"> {
    switch (role) {
        case "moderator":
            return {
                canModerate: true,
                canAccessFinancials: false,
                canManageSystem: false,
            };
        case "support":
            return {
                canModerate: false,
                canAccessFinancials: false,
                canManageSystem: false,
            };
        case "super_admin":
        default:
            return {
                canModerate: true,
                canAccessFinancials: true,
                canManageSystem: true,
            };
    }
}

export function RbacProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<AdminRole>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchAdmin<{ adminRole: string }>("/api/admin/preferences");
                setRole((data.adminRole as AdminRole) ?? "super_admin");
            } catch {
                // Default to full access if preference API unavailable
                setRole("super_admin");
            }
        };
        load();
    }, []);

    const value: RbacContextValue = {
        role,
        ...derivePermissions(role),
    };

    return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbac() {
    return useContext(RbacContext);
}
