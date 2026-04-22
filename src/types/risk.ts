/**
 * Risk management types and interfaces
 * Defines data structures for fraud detection, user risk profiling, and activity monitoring
 */

/**
 * Risk score represents the likelihood of fraud/chargeback for a user (0-100)
 * 0: Very low risk
 * 100: Critical risk (immediate action required)
 */
export type RiskScore = number & { readonly __brand: "RiskScore" };

export const createRiskScore = (value: number): RiskScore => {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return clamped as RiskScore;
};

/**
 * Risk level categories for display and filtering
 */
export enum RiskLevel {
  CRITICAL = "critical", // > 80
  HIGH = "high", // 60-80
  MEDIUM = "medium", // 40-60
  LOW = "low", // 20-40
  MINIMAL = "minimal", // < 20
}

export const getRiskLevel = (score: RiskScore): RiskLevel => {
  if (score > 80) return RiskLevel.CRITICAL;
  if (score > 60) return RiskLevel.HIGH;
  if (score > 40) return RiskLevel.MEDIUM;
  if (score > 20) return RiskLevel.LOW;
  return RiskLevel.MINIMAL;
};

/**
 * Factors considered in risk score calculation
 */
export interface RiskFactors {
  accountAge: number; // Days since account creation
  chargebackCount: number; // Historical chargebacks
  chargebackRate: number; // % of transactions that chargedback
  transactionVelocity: number; // Transactions per hour
  spendingVelocity: number; // Amount spent per hour
  deviceChanges: number; // Number of unique devices
  ipChanges: number; // Number of unique IPs
  failedPaymentAttempts: number; // Failed payment retries
}

/**
 * User risk profile combining score and supporting data
 */
export interface UserRiskProfile {
  userId: string;
  riskScore: RiskScore;
  riskLevel: RiskLevel;
  factors: RiskFactors;
  lastUpdated: Date;
  isFrozen: boolean;
  freezeReason?: string;
}

/**
 * Creator risk profile - extends user profile with creator-specific metrics
 */
export interface CreatorRiskProfile extends UserRiskProfile {
  creatorId: string;
  earningsFromNewUsers: number; // % of total earnings
  topFanConcentration: number; // % of earnings from top fan
  refundRate: number; // %
  disputeRate: number; // %
}

/**
 * Transaction-level risk assessment
 */
export interface TransactionRisk {
  transactionId: string;
  riskScore: RiskScore;
  riskLevel: RiskLevel;
  fanRiskScore: RiskScore;
  creatorRiskScore: RiskScore;
  paymentMethodFingerprint: string; // Hash of card/payment details
  ipLocation?: string;
  isNewUser: boolean;
  timeSinceAccountCreation: number; // Days
  flaggedReasons: string[]; // e.g., "new user high spend", "velocity spike"
}

/**
 * High-risk activity event for the activity feed
 */
export interface RiskEvent {
  id: string;
  type: "velocity_spike" | "high_risk_user" | "new_user_high_spend" | "shared_ip" | "high_chargeback_rate" | "custom";
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  userId?: string;
  creatorId?: string;
  transactionId?: string;
  riskScore: RiskScore;
  timestamp: Date;
  reviewed: boolean;
  reviewedAt?: Date;
  reviewedBy?: string;
  actions: RiskAction[];
}

/**
 * Quick actions available on risk events
 */
export interface RiskAction {
  id: string;
  label: string;
  type: "freeze_user" | "freeze_creator" | "pause_payouts" | "lock_account" | "manual_review" | "dismiss";
  requiresConfirm: boolean;
}

/**
 * Velocity rule for automated alerting
 */
export interface VelocityRule {
  id: string;
  name: string;
  description: string;
  type: "spend" | "transaction_count" | "account_velocity";
  threshold: number;
  timeWindow: number; // Seconds
  severity: "critical" | "high" | "medium";
  enabled: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Risk threshold for automatic actions
 */
export interface RiskThreshold {
  id: string;
  name: string;
  condition: string; // e.g., "riskScore > 80"
  action: "freeze_payouts" | "freeze_account" | "require_manual_review" | "alert";
  enabled: boolean;
  createdAt: Date;
  createdBy: string;
}

/**
 * Risk overview metrics displayed on dashboard
 */
export interface RiskOverviewMetrics {
  disputeRate: number; // %
  refundRate: number; // %
  flaggedTransactions: number; // Count
  newCreators24h: number; // Count
  pendingBalance: number; // Currency amount
  availableBalance: number; // Currency amount
  criticalRiskUsers: number; // Count with score > 80
  highRiskTransactions: number; // Count in last 24h
}

/**
 * Payout request with risk assessment
 */
export interface PayoutRequest {
  id: string;
  creatorId: string;
  amount: number;
  creatorRiskScore: RiskScore;
  earningsFromNewUsers: number; // %
  timeEarned: Date;
  chargebackExposure: number; // Count in last 7 days
  status: "pending" | "approved" | "delayed" | "frozen" | "completed";
  approvedAt?: Date;
  approvedBy?: string;
  notes?: string;
}

/**
 * Context for risk state management
 */
export interface RiskContextType {
  // Risk data
  userRiskProfiles: Map<string, UserRiskProfile>;
  recentRiskEvents: RiskEvent[];
  velocityRules: VelocityRule[];
  riskThresholds: RiskThreshold[];
  overviewMetrics: RiskOverviewMetrics | null;
  payoutRequests: PayoutRequest[];

  // Actions
  fetchUserRiskProfile: (userId: string) => Promise<UserRiskProfile>;
  fetchRecentRiskEvents: (limit?: number) => Promise<RiskEvent[]>;
  fetchVelocityRules: () => Promise<VelocityRule[]>;
  fetchRiskThresholds: () => Promise<RiskThreshold[]>;
  fetchOverviewMetrics: () => Promise<RiskOverviewMetrics>;
  fetchPayoutRequests: () => Promise<PayoutRequest[]>;

  // Mutations
  freezeUser: (userId: string, reason: string) => Promise<void>;
  unfreezeUser: (userId: string) => Promise<void>;
  freezeCreator: (creatorId: string, reason: string) => Promise<void>;
  unfreezeCreator: (creatorId: string) => Promise<void>;
  pausePayouts: (creatorId: string, reason: string) => Promise<void>;
  resumePayouts: (creatorId: string) => Promise<void>;
  approvePayoutRequest: (payoutId: string) => Promise<void>;
  delayPayoutRequest: (payoutId: string, reason: string) => Promise<void>;
  reviewRiskEvent: (eventId: string) => Promise<void>;
  approveRiskAction: (eventId: string, actionId: string) => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
}
