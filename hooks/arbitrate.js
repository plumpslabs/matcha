/**
 * 🍵 matcha — arbitrate.js
 * Signal arbitration: precedence rules when tools disagree (issue #10).
 *
 * Order (documented, enforced, logged):
 *   1. Mechanical beats advisory — hook/CI verdicts outrank tool opinions.
 *   2. Fresh evidence beats memory — current-run logs/tests outrank recalled gotchas.
 *   3. Stop beats go — any STOP defaults to halt unless a higher-precedence GO
 *      explicitly overrides with a reason.
 *   4. Disagreement is logged — every arbitration records both signals + winner
 *      + rule applied.
 *
 * Signal shape: { source, kind: "mechanical"|"advisory", fresh: bool, verdict: "stop"|"go" }
 * Result shape: { decision: "stop"|"go", winner, rule, log }
 */

function rank(signal) {
  // Mechanical outranks advisory; within the same kind, fresh outranks stale.
  return (signal.kind === "mechanical" ? 2 : 0) + (signal.fresh ? 1 : 0);
}

export function arbitrate(signals) {
  const list = (Array.isArray(signals) ? signals : []).filter(
    (s) => s && (s.verdict === "stop" || s.verdict === "go")
  );
  if (list.length === 0) return { decision: "go", winner: null, rule: "no-signals", log: "arbitrate: no signals — default GO" };

  const ranked = list.map((s) => ({ s, r: rank(s) })).sort((a, b) => b.r - a.r);
  const top = ranked[0];

  // Rule 3: STOP beats GO at equal precedence — halt unless a HIGHER-precedence
  // GO explicitly overrides. A higher-ranked GO wins only with a reason.
  const stops = ranked.filter((e) => e.s.verdict === "stop");
  const goes = ranked.filter((e) => e.s.verdict === "go");

  let decision;
  let winner;
  let rule;
  if (stops.length === 0) {
    decision = "go";
    winner = top.s.source;
    rule = "unanimous-go";
  } else if (goes.length === 0) {
    decision = "stop";
    winner = stops[0].s.source;
    rule = "unanimous-stop";
  } else if (goes[0].r > stops[0].r) {
    const go = goes[0].s;
    if (go.reason) {
      decision = "go";
      winner = go.source;
      rule = "higher-precedence-go-with-reason";
    } else {
      decision = "stop";
      winner = stops[0].s.source;
      rule = "stop-beats-go-without-override-reason";
    }
  } else {
    decision = "stop";
    winner = stops[0].s.source;
    rule = (stops[0].s.kind === "mechanical" && goes[0].s.kind === "advisory")
      ? "mechanical-stop"
      : "stop-beats-go";
  }

  const names = list.map((s) => `${s.source}=${s.verdict}`).join(", ");
  return {
    decision,
    winner,
    rule,
    log: `arbitrate: [${names}] → ${decision.toUpperCase()} (winner: ${winner}, rule: ${rule})`,
  };
}
