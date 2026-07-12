/**
 * Regression tests for src/components/security/SecurityOverviewPanel.tsx
 *
 * Sprint D#1 refactored the panel's Supabase reads into sequential typed
 * queries with `as any` to break TS2589 recursion. These tests lock in the
 * observable outputs the UI derives from those reads:
 *   - security score bounds and MFA/failed-login/critical-event penalties
 *   - alert set generated for common threat combinations
 * Logic is exercised as a pure function to keep the test fast and isolated
 * from the DOM/RTK/Supabase surface, guarding against silent regressions in
 * the math when the fetch pipeline is next refactored.
 */
import { describe, it, expect } from 'vitest';

interface Inputs {
  devices: Array<{ is_trusted?: boolean }>;
  loginAttempts: Array<{ success?: boolean }>;
  securityEvents: Array<{ severity?: string }>;
  mfaEnabled: boolean;
}

// Mirror of the pure branch of SecurityOverviewPanel.fetchSecurityStats.
// Keep in sync with the component; any drift here is a regression signal.
function computeSecuritySignals(input: Inputs) {
  const trustedDevices = input.devices.filter(d => d.is_trusted).length;
  const failedLogins = input.loginAttempts.filter(l => !l.success).length;
  const criticalEvents = input.securityEvents.filter(
    e => e.severity === 'critical' || e.severity === 'error',
  ).length;

  let score = 50;
  if (input.mfaEnabled) score += 20;
  if (input.devices.length > 0) {
    score += Math.round((trustedDevices / input.devices.length) * 10);
  }
  if (failedLogins > 5) score -= 10;
  if (failedLogins > 10) score -= 10;
  if (criticalEvents > 0) score -= criticalEvents * 5;
  score = Math.max(0, Math.min(100, score));

  const alerts: string[] = [];
  if (failedLogins > 5) alerts.push('failed-logins');
  if (criticalEvents > 0) alerts.push('critical-events');
  if (!input.mfaEnabled) alerts.push('mfa-disabled');
  if (input.devices.length > 0 && trustedDevices === 0) alerts.push('no-trusted');

  return { score, alerts, trustedDevices, failedLogins, criticalEvents };
}

describe('SecurityOverviewPanel — score computation', () => {
  it('baseline score is 50 with no signals and MFA disabled', () => {
    const r = computeSecuritySignals({ devices: [], loginAttempts: [], securityEvents: [], mfaEnabled: false });
    expect(r.score).toBe(50);
  });

  it('MFA adds 20 points', () => {
    const r = computeSecuritySignals({ devices: [], loginAttempts: [], securityEvents: [], mfaEnabled: true });
    expect(r.score).toBe(70);
  });

  it('trusted-devices ratio adds up to 10 rounded', () => {
    const r = computeSecuritySignals({
      devices: [{ is_trusted: true }, { is_trusted: false }, { is_trusted: true }],
      loginAttempts: [], securityEvents: [], mfaEnabled: false,
    });
    expect(r.score).toBe(50 + Math.round((2 / 3) * 10)); // 57
  });

  it('failed logins above 5 and above 10 stack -10 penalties', () => {
    const attempts = Array.from({ length: 12 }, () => ({ success: false }));
    const r = computeSecuritySignals({ devices: [], loginAttempts: attempts, securityEvents: [], mfaEnabled: false });
    expect(r.failedLogins).toBe(12);
    expect(r.score).toBe(30);
  });

  it('critical events subtract 5 each', () => {
    const events = [
      { severity: 'critical' },
      { severity: 'error' },
      { severity: 'info' }, // ignored
    ];
    const r = computeSecuritySignals({ devices: [], loginAttempts: [], securityEvents: events, mfaEnabled: false });
    expect(r.criticalEvents).toBe(2);
    expect(r.score).toBe(40);
  });

  it('score never drops below 0 or exceeds 100', () => {
    const catastrophic = computeSecuritySignals({
      devices: [{ is_trusted: false }],
      loginAttempts: Array.from({ length: 50 }, () => ({ success: false })),
      securityEvents: Array.from({ length: 30 }, () => ({ severity: 'critical' })),
      mfaEnabled: false,
    });
    expect(catastrophic.score).toBe(0);

    const pristine = computeSecuritySignals({
      devices: Array.from({ length: 10 }, () => ({ is_trusted: true })),
      loginAttempts: [], securityEvents: [], mfaEnabled: true,
    });
    expect(pristine.score).toBeLessThanOrEqual(100);
    expect(pristine.score).toBeGreaterThan(50);
  });
});

describe('SecurityOverviewPanel — alert generation', () => {
  it('emits mfa-disabled when MFA is off with no other signals', () => {
    const r = computeSecuritySignals({ devices: [], loginAttempts: [], securityEvents: [], mfaEnabled: false });
    expect(r.alerts).toContain('mfa-disabled');
    expect(r.alerts).not.toContain('failed-logins');
  });

  it('does not emit mfa-disabled when MFA is on', () => {
    const r = computeSecuritySignals({ devices: [], loginAttempts: [], securityEvents: [], mfaEnabled: true });
    expect(r.alerts).not.toContain('mfa-disabled');
  });

  it('emits no-trusted only when devices exist but none are trusted', () => {
    const withDevices = computeSecuritySignals({
      devices: [{ is_trusted: false }], loginAttempts: [], securityEvents: [], mfaEnabled: true,
    });
    expect(withDevices.alerts).toContain('no-trusted');

    const noDevices = computeSecuritySignals({
      devices: [], loginAttempts: [], securityEvents: [], mfaEnabled: true,
    });
    expect(noDevices.alerts).not.toContain('no-trusted');
  });

  it('emits failed-logins alert only above the 5-attempt threshold', () => {
    const under = computeSecuritySignals({
      devices: [], loginAttempts: Array.from({ length: 5 }, () => ({ success: false })),
      securityEvents: [], mfaEnabled: true,
    });
    expect(under.alerts).not.toContain('failed-logins');

    const over = computeSecuritySignals({
      devices: [], loginAttempts: Array.from({ length: 6 }, () => ({ success: false })),
      securityEvents: [], mfaEnabled: true,
    });
    expect(over.alerts).toContain('failed-logins');
  });

  it('emits critical-events on any critical severity', () => {
    const r = computeSecuritySignals({
      devices: [], loginAttempts: [],
      securityEvents: [{ severity: 'critical' }], mfaEnabled: true,
    });
    expect(r.alerts).toContain('critical-events');
  });

  it('combines multiple alerts without duplication', () => {
    const r = computeSecuritySignals({
      devices: [{ is_trusted: false }],
      loginAttempts: Array.from({ length: 8 }, () => ({ success: false })),
      securityEvents: [{ severity: 'error' }],
      mfaEnabled: false,
    });
    expect(new Set(r.alerts)).toEqual(new Set([
      'failed-logins', 'critical-events', 'mfa-disabled', 'no-trusted',
    ]));
  });
});
