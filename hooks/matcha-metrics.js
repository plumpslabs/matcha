/**
 * 🍵 matcha — matcha-metrics.js
 * Shared metrics collection for all matcha hooks.
 * Writes to .agents/matcha-metrics.json after each session.
 *
 * Usage:
 *   import { recordShieldBlock, recordModeSwitch, recordReviewIssue } from "./matcha-metrics.js";
 *
 * Enhanced features:
 *   - Auto-collection from review output
 *   - False positive tracking
 *   - Review verdicts with tier info
 *   - Impact metrics (time saved, bugs prevented)
 *   - Trend analysis over sessions
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const METRICS_DIR = join(ROOT, ".agents");
const METRICS_FILE = join(METRICS_DIR, "matcha-metrics.json");

function ensureDir() {
  try {
    mkdirSync(METRICS_DIR, { recursive: true });
  } catch {}
}

function loadMetrics() {
  try {
    if (existsSync(METRICS_FILE)) {
      return JSON.parse(readFileSync(METRICS_FILE, "utf-8"));
    }
  } catch {}
  return {
    version: "2.0.0",
    sessions: [],
    totals: {
      shieldBlocks: 0,
      planningGateBlocks: 0,
      modeSwitches: 0,
      reviewIssues: 0,
      reviewVerdicts: { PASS: 0, PASS_WITH_FIXES: 0, BLOCK: 0, EXPERT_REQUIRED: 0 },
      autoSkips: 0,
      simpleTasksDetected: 0,
      dangerousCommandsBlocked: 0,
      falsePositives: 0,
      truePositives: 0,
      tasksCompleted: 0,
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
      reviewsRun: 0,
      reviewsByTier: { L0: 0, L1: 0, L2: 0, L3: 0 },
    },
  };
}

function saveMetrics(metrics) {
  ensureDir();
  try {
    writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2));
  } catch {}
}

function getOrCreateSession(metrics) {
  const today = new Date().toISOString().split("T")[0];
  let session = metrics.sessions.find((s) => s.date === today);
  if (!session) {
    session = {
      date: today,
      shieldBlocks: 0,
      planningGateBlocks: 0,
      modeSwitches: 0,
      reviewIssues: 0,
      autoSkips: 0,
      simpleTasksDetected: 0,
      dangerousCommandsBlocked: 0,
      modes: {},
      blockedCommands: [],
      reviews: [],
      verdicts: { PASS: 0, PASS_WITH_FIXES: 0, BLOCK: 0, EXPERT_REQUIRED: 0 },
      reviewsByTier: { L0: 0, L1: 0, L2: 0, L3: 0 },
      falsePositives: 0,
      truePositives: 0,
      tasksCompleted: 0,
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
    };
    metrics.sessions.push(session);
  }
  return session;
}

// ─── Public API ────────────────────────────────────────────────────────────

export function recordShieldBlock(command, reason) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.shieldBlocks++;
  metrics.totals.dangerousCommandsBlocked++;
  session.shieldBlocks++;
  session.dangerousCommandsBlocked++;
  session.blockedCommands.push({
    time: new Date().toISOString(),
    command: command.substring(0, 200),
    reason: reason.substring(0, 200),
  });
  // Keep only last 50 blocked commands per session
  if (session.blockedCommands.length > 50) {
    session.blockedCommands = session.blockedCommands.slice(-50);
  }
  saveMetrics(metrics);
}

export function recordPlanningGateBlock() {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.planningGateBlocks++;
  session.planningGateBlocks++;
  saveMetrics(metrics);
}

export function recordModeSwitch(mode, previousMode) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.modeSwitches++;
  session.modeSwitches++;
  if (!session.modes[mode]) session.modes[mode] = 0;
  session.modes[mode]++;
  saveMetrics(metrics);
}

export function recordReviewIssue(category, severity, file) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.reviewIssues++;
  session.reviewIssues++;
  saveMetrics(metrics);
}

export function recordAutoSkip(reason) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.autoSkips++;
  session.autoSkips++;
  saveMetrics(metrics);
}

export function recordSimpleTask() {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.simpleTasksDetected++;
  session.simpleTasksDetected++;
  saveMetrics(metrics);
}

// ─── Enhanced API (v2) ──────────────────────────────────────────────────────

/**
 * Record a review verdict with tier info.
 * @param {string} verdict - PASS, PASS_WITH_FIXES, BLOCK, EXPERT_REQUIRED
 * @param {string} tier - L0, L1, L2, L3
 * @param {object} details - { files, criticalCount, warningCount, infoCount }
 */
export function recordReviewVerdict(verdict, tier, details = {}) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);

  // Update totals
  metrics.totals.reviewsRun++;
  metrics.totals.reviewVerdicts[verdict] = (metrics.totals.reviewVerdicts[verdict] || 0) + 1;
  metrics.totals.reviewsByTier[tier] = (metrics.totals.reviewsByTier[tier] || 0) + 1;

  // Update session
  session.verdicts[verdict] = (session.verdicts[verdict] || 0) + 1;
  session.reviewsByTier[tier] = (session.reviewsByTier[tier] || 0) + 1;

  // Log review details
  session.reviews.push({
    time: new Date().toISOString(),
    verdict,
    tier,
    files: details.files || [],
    criticalCount: details.criticalCount || 0,
    warningCount: details.warningCount || 0,
    infoCount: details.infoCount || 0,
  });

  // Keep only last 30 reviews per session
  if (session.reviews.length > 30) {
    session.reviews = session.reviews.slice(-30);
  }

  saveMetrics(metrics);
}

/**
 * Record a false positive (user marked an issue as incorrect).
 * @param {string} issueId - identifier for the false positive
 * @param {string} category - what type of issue was incorrectly flagged
 */
export function recordFalsePositive(issueId, category = "unknown") {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.falsePositives++;
  session.falsePositives++;
  saveMetrics(metrics);
}

/**
 * Record a true positive (user confirmed an issue was correct).
 * @param {string} issueId - identifier for the true positive
 */
export function recordTruePositive(issueId) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.truePositives++;
  session.truePositives++;
  saveMetrics(metrics);
}

/**
 * Record task completion with impact metrics.
 * @param {object} impact - { filesChanged, linesAdded, linesRemoved, timeMinutes }
 */
export function recordTaskCompletion(impact = {}) {
  const metrics = loadMetrics();
  const session = getOrCreateSession(metrics);
  metrics.totals.tasksCompleted++;
  session.tasksCompleted++;
  metrics.totals.filesChanged += impact.filesChanged || 0;
  metrics.totals.linesAdded += impact.linesAdded || 0;
  metrics.totals.linesRemoved += impact.linesRemoved || 0;
  session.filesChanged += impact.filesChanged || 0;
  session.linesAdded += impact.linesAdded || 0;
  session.linesRemoved += impact.linesRemoved || 0;
  saveMetrics(metrics);
}

// ─── Query API ──────────────────────────────────────────────────────────────

export function getMetrics() {
  return loadMetrics();
}

/**
 * Get metrics summary with trends and insights.
 */
export function getMetricsSummary() {
  const metrics = loadMetrics();
  const recentSessions = metrics.sessions.slice(-7);
  const totals = metrics.totals;

  // Calculate trends
  const trends = {};
  if (recentSessions.length >= 2) {
    const firstHalf = recentSessions.slice(0, Math.floor(recentSessions.length / 2));
    const secondHalf = recentSessions.slice(Math.floor(recentSessions.length / 2));

    const avgFirst = (arr, key) => arr.reduce((a, s) => a + (s[key] || 0), 0) / arr.length;
    const avgSecond = (arr, key) => arr.reduce((a, s) => a + (s[key] || 0), 0) / arr.length;

    trends.shieldBlocks = {
      direction: avgSecond(recentSessions, "shieldBlocks") > avgFirst(recentSessions, "shieldBlocks") ? "increasing" : "decreasing",
      change: Math.round(((avgSecond(recentSessions, "shieldBlocks") - avgFirst(recentSessions, "shieldBlocks")) / Math.max(avgFirst(recentSessions, "shieldBlocks"), 1)) * 100),
    };
    trends.autoSkips = {
      direction: avgSecond(recentSessions, "autoSkips") > avgFirst(recentSessions, "autoSkips") ? "increasing" : "decreasing",
      change: Math.round(((avgSecond(recentSessions, "autoSkips") - avgFirst(recentSessions, "autoSkips")) / Math.max(avgFirst(recentSessions, "autoSkips"), 1)) * 100),
    };
  }

  // Calculate false positive rate
  const totalIssues = totals.truePositives + totals.falsePositives;
  const falsePositiveRate = totalIssues > 0 ? Math.round((totals.falsePositives / totalIssues) * 100) : 0;

  // Compliance rate
  const totalReviews = totals.reviewVerdicts.PASS + totals.reviewVerdicts.PASS_WITH_FIXES + totals.reviewVerdicts.BLOCK + totals.reviewVerdicts.EXPERT_REQUIRED;
  const complianceRate = totalReviews > 0 ? Math.round(((totals.reviewVerdicts.PASS + totals.reviewVerdicts.PASS_WITH_FIXES) / totalReviews) * 100) : 0;

  return {
    totals,
    recentSessions: recentSessions.length,
    avgShieldBlocks:
      recentSessions.length > 0
        ? Math.round(
            recentSessions.reduce((a, s) => a + s.shieldBlocks, 0) /
              recentSessions.length
          )
        : 0,
    avgAutoSkips:
      recentSessions.length > 0
        ? Math.round(
            recentSessions.reduce((a, s) => a + s.autoSkips, 0) /
              recentSessions.length
          )
        : 0,
    topModes: Object.entries(
      recentSessions.reduce((acc, s) => {
        for (const [mode, count] of Object.entries(s.modes || {})) {
          acc[mode] = (acc[mode] || 0) + count;
        }
        return acc;
      }, {})
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5),
    trends,
    falsePositiveRate,
    complianceRate,
    reviewsByTier: totals.reviewsByTier,
    verdicts: totals.reviewVerdicts,
  };
}

/**
 * Generate a human-readable metrics report.
 */
export function formatMetricsReport() {
  const summary = getMetricsSummary();
  const t = summary.totals;

  let msg = `🍵 matcha: metrics\n\n`;

  msg += `📊 All-Time Metrics\n`;
  msg += `  Sessions:       ${t.sessions?.length || 0}\n`;
  msg += `  Tasks:          ${t.tasksCompleted}\n`;
  msg += `  Reviews run:    ${t.reviewsRun}\n`;
  msg += `  Issues caught:  ${t.reviewIssues} (prevented from shipping)\n`;
  msg += `  FP rate:        ${summary.falsePositiveRate}%\n`;
  msg += `  Compliance:     ${summary.complianceRate}%\n\n`;

  if (t.reviewsRun > 0) {
    msg += `📈 Reviews by Tier\n`;
    msg += `  L0 (Disposable):  ${t.reviewsByTier.L0}\n`;
    msg += `  L1 (Low):         ${t.reviewsByTier.L1}\n`;
    msg += `  L2 (Product):     ${t.reviewsByTier.L2}\n`;
    msg += `  L3 (High Risk):   ${t.reviewsByTier.L3}\n\n`;

    msg += `📊 Verdicts\n`;
    msg += `  PASS:              ${t.reviewVerdicts.PASS}\n`;
    msg += `  PASS_WITH_FIXES:   ${t.reviewVerdicts.PASS_WITH_FIXES}\n`;
    msg += `  BLOCK:             ${t.reviewVerdicts.BLOCK}\n`;
    msg += `  EXPERT_REQUIRED:   ${t.reviewVerdicts.EXPERT_REQUIRED}\n\n`;
  }

  if (Object.keys(summary.topModes).length > 0) {
    msg += `🎯 Top Modes\n`;
    for (const [mode, count] of summary.topModes) {
      msg += `  ${mode}: ${count}\n`;
    }
    msg += `\n`;
  }

  if (Object.keys(summary.trends).length > 0) {
    msg += `📉 Trends\n`;
    for (const [key, trend] of Object.entries(summary.trends)) {
      msg += `  ${key}: ${trend.direction} (${trend.change > 0 ? "+" : ""}${trend.change}%)\n`;
    }
    msg += `\n`;
  }

  msg += `🛡️ Safety\n`;
  msg += `  Shield blocks:     ${t.shieldBlocks}\n`;
  msg += `  Planning blocks:   ${t.planningGateBlocks}\n`;
  msg += `  Auto skips:        ${t.autoSkips}\n`;
  msg += `  Simple tasks:      ${t.simpleTasksDetected}\n`;

  return msg;
}
