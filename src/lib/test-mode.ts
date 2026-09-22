interface TestSession {
  activatedAt: number;
  expiresAt: number;
  deviceId: string;
}

const activeSessions = new Map<string, TestSession>();
const TEST_MODE_DURATION_MS = 60 * 60 * 1000;

function cleanExpired() {
  const now = Date.now();
  for (const [key, session] of activeSessions) {
    if (session.expiresAt <= now) activeSessions.delete(key);
  }
}

export function isTestModeActive(deviceId: string): boolean {
  cleanExpired();
  const session = activeSessions.get(deviceId);
  return !!session && session.expiresAt > Date.now();
}

export function getTestModeStatus(deviceId: string): { active: boolean; expiresAt?: number; remainingMinutes?: number } {
  cleanExpired();
  const session = activeSessions.get(deviceId);
  if (session && session.expiresAt > Date.now()) {
    return {
      active: true,
      expiresAt: session.expiresAt,
      remainingMinutes: Math.ceil((session.expiresAt - Date.now()) / 60000),
    };
  }
  return { active: false };
}

export function activateTestMode(deviceId: string): { active: boolean; expiresAt: number; remainingMinutes: number } {
  cleanExpired();
  const now = Date.now();
  const session: TestSession = {
    activatedAt: now,
    expiresAt: now + TEST_MODE_DURATION_MS,
    deviceId,
  };
  activeSessions.set(deviceId, session);
  return { active: true, expiresAt: session.expiresAt, remainingMinutes: 60 };
}

export function deactivateTestMode(deviceId: string): void {
  activeSessions.delete(deviceId);
}

export function hasAnyActiveTestMode(): boolean {
  cleanExpired();
  return activeSessions.size > 0;
}
