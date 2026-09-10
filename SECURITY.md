# Security Policy & Threat Model

> 🍵 **matcha** — Simple. Efficient. Deliberate. Never twice.

---

## 1. Architectural Role & Security Boundary

Matcha operates strictly as a **Developer-Side / Pre-Flight Governance Layer** for AI coding agents.

### Enterprise Positioning:
```
AI Coding Agent Workspace (Matcha pre-flight governance)
       │
       ▼ (Passes Planning Gate + Safety Shield + Post-Write Scan)
Pull Request (GitHub / GitLab / Bitbucket)
       │
       ▼ (Mandatory Branch Protection)
Human Code Review (Senior Engineer Approval)
       │
       ▼ (CI/CD Pipeline)
CI Verification: Unit/Integration Tests + SAST/DAST + Secret Scanner + Dependency Audit
       │
       ▼
Production Deployment
```

> [!IMPORTANT]
> **Matcha is NOT a replacement for CI/CD, branch protection, or human review.**
> It is an upstream, shift-left policy engine designed to prevent agents from creating messy diffs, destructive command executions, and accidental leaks *before* code reaches version control.

---

## 2. Threat Model

### ✅ In-Scope (What Matcha Protects Against):
1. **Destructive Command Execution:**
   - Blocks catastrophic shell commands (`rm -rf /`, `rm -rf ~`, `mkfs`, disk device overwrites via `dd`, `git reset --hard`, unleased force pushes).
2. **Hardcoded Secrets & Credential Leaks:**
   - Scans file write buffers for exposed API keys, private keys, access tokens, and passwords via `patterns.json` regex registry.
3. **Agent Scope Sprawl & Unbounded Hallucinations:**
   - Enforces the **Planning Gate** (`.agents/plan/current.md`), halting writes until a structured problem, goals, and bounded execution plan are recorded.
4. **"Theater of Compliance" (Anti-Rubber-Stamping):**
   - Captures machine-readable test execution evidence (`.agents/state/evidence.json`) with process exit codes, preventing agents from hallucinating "all tests passed".
5. **Silent Overrides & Bypass Tracking:**
   - Every bypass or override (`MATCHA_SHIELD_OFF`, `matcha off`) is logged with an ISO timestamp, actor, and rationale to `.agents/audit.log`.

### ❌ Out-of-Scope (What Matcha Does NOT Guarantee):
1. **Deep Business Logic Exploits:**
   - Matcha cannot prove the absence of IDOR (Broken Object Level Authorization), complex state machine bugs, or distributed race conditions.
2. **Zero-Day Vulnerabilities in Dependencies:**
   - Dependency vulnerability auditing requires dedicated SCA tools (e.g., Snyk, Dependabot, Trivy) in your CI pipeline.
3. **Bypassed Execution:**
   - If commands are executed directly in an external shell without AI agent hooks, Matcha's runtime hooks are not triggered.

---

## 3. Auditability & Emergency Overrides

Matcha supports both frictionless prototyping and enterprise compliance:
- **Toggle Off:** `matcha off` or `/matcha:off` allows free exploration, but logs the action to `.agents/audit.log`.
- **Environment Override:** `MATCHA_SHIELD_OFF=true` disables shield blocking, appending an audit record for compliance inspection.
- **Audit Review:** Run `matcha audit` at any time to inspect recent override events.

---

## 4. Reporting a Security Vulnerability

If you discover a security vulnerability in Matcha (such as a bypass vector in `matcha-shield.js` or command injection in hook arguments), please report it responsibly:

- **Email:** `security@plumpslabs.dev`
- **GitHub:** Submit a [Private Vulnerability Report](https://github.com/plumpslabs/matcha/security/advisories/new) via GitHub Security Advisories.

### Response Time & SLA:
- **Acknowledgement:** Within 48 hours.
- **Triage & Assessment:** Within 3 business days.
- **Patch Release:** Within 7 business days for high/critical severity issues.

Please do **NOT** open public GitHub issues for undisclosed security vulnerabilities.
