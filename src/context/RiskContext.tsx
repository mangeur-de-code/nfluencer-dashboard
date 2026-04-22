"use client";

import type React from "react";
import { createContext, useState, useContext, useCallback } from "react";
import { useAdminFetch } from "../lib/adminApi";
import type {
  UserRiskProfile,
  RiskEvent,
  VelocityRule,
  RiskThreshold,
  RiskOverviewMetrics,
  PayoutRequest,
  RiskContextType,
} from "../types/risk";

const RiskContext = createContext<RiskContextType | undefined>(undefined);

export const RiskProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const fetchAdmin = useAdminFetch();

  // State
  const [userRiskProfiles, setUserRiskProfiles] = useState<
    Map<string, UserRiskProfile>
  >(new Map());
  const [recentRiskEvents, setRecentRiskEvents] = useState<RiskEvent[]>([]);
  const [velocityRules, setVelocityRules] = useState<VelocityRule[]>([]);
  const [riskThresholds, setRiskThresholds] = useState<RiskThreshold[]>([]);
  const [overviewMetrics, setOverviewMetrics] =
    useState<RiskOverviewMetrics | null>(null);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Queries
  const fetchUserRiskProfile = useCallback(
    async (userId: string): Promise<UserRiskProfile> => {
      setLoading(true);
      setError(null);
      try {
        const profile = await fetchAdmin<UserRiskProfile>(
          `/api/admin/users/${userId}/risk`
        );
        setUserRiskProfiles((prev) => new Map(prev).set(userId, profile));
        return profile;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch risk profile";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const fetchRecentRiskEvents = useCallback(
    async (limit = 50): Promise<RiskEvent[]> => {
      setLoading(true);
      setError(null);
      try {
        const events = await fetchAdmin<RiskEvent[]>(
          "/api/admin/risk/events",
          { limit }
        );
        setRecentRiskEvents(events);
        return events;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch risk events";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const fetchVelocityRules = useCallback(async (): Promise<VelocityRule[]> => {
    setLoading(true);
    setError(null);
    try {
      const rules = await fetchAdmin<VelocityRule[]>(
        "/api/admin/risk/velocity-rules"
      );
      setVelocityRules(rules);
      return rules;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch velocity rules";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchAdmin]);

  const fetchRiskThresholds = useCallback(
    async (): Promise<RiskThreshold[]> => {
      setLoading(true);
      setError(null);
      try {
        const thresholds = await fetchAdmin<RiskThreshold[]>(
          "/api/admin/risk/thresholds"
        );
        setRiskThresholds(thresholds);
        return thresholds;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch risk thresholds";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const fetchOverviewMetrics = useCallback(
    async (): Promise<RiskOverviewMetrics> => {
      setLoading(true);
      setError(null);
      try {
        const metrics = await fetchAdmin<RiskOverviewMetrics>(
          "/api/admin/risk/overview"
        );
        setOverviewMetrics(metrics);
        return metrics;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch risk overview";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const fetchPayoutRequests = useCallback(
    async (): Promise<PayoutRequest[]> => {
      setLoading(true);
      setError(null);
      try {
        const requests = await fetchAdmin<PayoutRequest[]>(
          "/api/admin/risk/payout-requests"
        );
        setPayoutRequests(requests);
        return requests;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch payout requests";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  // Mutations
  const freezeUser = useCallback(
    async (userId: string, reason: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/users/${userId}/freeze`,
          { method: "POST", body: JSON.stringify({ reason }) }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to freeze user";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const unfreezeUser = useCallback(
    async (userId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/users/${userId}/unfreeze`,
          { method: "POST" }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unfreeze user";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const freezeCreator = useCallback(
    async (creatorId: string, reason: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/creators/${creatorId}/freeze`,
          { method: "POST", body: JSON.stringify({ reason }) }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to freeze creator";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const unfreezeCreator = useCallback(
    async (creatorId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/creators/${creatorId}/unfreeze`,
          { method: "POST" }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to unfreeze creator";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const pausePayouts = useCallback(
    async (creatorId: string, reason: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/creators/${creatorId}/pause-payouts`,
          { method: "POST", body: JSON.stringify({ reason }) }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to pause payouts";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const resumePayouts = useCallback(
    async (creatorId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/creators/${creatorId}/resume-payouts`,
          { method: "POST" }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to resume payouts";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const approvePayoutRequest = useCallback(
    async (payoutId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/risk/payout-requests/${payoutId}/approve`,
          { method: "POST" }
        );
        setPayoutRequests((prev) =>
          prev.map((request) =>
            request.id === payoutId
              ? { ...request, status: "approved", approvedAt: new Date() }
              : request
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve payout request";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const delayPayoutRequest = useCallback(
    async (payoutId: string, reason: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/risk/payout-requests/${payoutId}/delay`,
          { method: "POST", body: JSON.stringify({ reason }) }
        );
        setPayoutRequests((prev) =>
          prev.map((request) =>
            request.id === payoutId
              ? { ...request, status: "delayed", delayReason: reason }
              : request
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delay payout request";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const reviewRiskEvent = useCallback(
    async (eventId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/risk/events/${eventId}/review`,
          { method: "POST" }
        );
        // Update local state
        setRecentRiskEvents((prev) =>
          prev.map((evt) =>
            evt.id === eventId
              ? { ...evt, reviewed: true, reviewedAt: new Date() }
              : evt
          )
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to review risk event";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const approveRiskAction = useCallback(
    async (eventId: string, actionId: string): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        await fetchAdmin<{ success: boolean }>(
          `/api/admin/risk/events/${eventId}/actions/${actionId}/approve`,
          { method: "POST" }
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to approve risk action";
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchAdmin]
  );

  const value: RiskContextType = {
    userRiskProfiles,
    recentRiskEvents,
    velocityRules,
    riskThresholds,
    overviewMetrics,
    payoutRequests,
    fetchUserRiskProfile,
    fetchRecentRiskEvents,
    fetchVelocityRules,
    fetchRiskThresholds,
    fetchOverviewMetrics,
    fetchPayoutRequests,
    freezeUser,
    unfreezeUser,
    freezeCreator,
    unfreezeCreator,
    pausePayouts,
    resumePayouts,
    approvePayoutRequest,
    delayPayoutRequest,
    reviewRiskEvent,
    approveRiskAction,
    loading,
    error,
  };

  return (
    <RiskContext.Provider value={value}>{children}</RiskContext.Provider>
  );
};

/**
 * Hook to access risk context
 * @throws Error if used outside RiskProvider
 */
export const useRisk = (): RiskContextType => {
  const context = useContext(RiskContext);
  if (context === undefined) {
    throw new Error("useRisk must be used within a RiskProvider");
  }
  return context;
};
