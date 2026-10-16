import type { AuditResult, InputMode } from '../types/dpdp';
import { auditForm } from '../engine/ruleEngine';

export interface AuditResponse {
  result: AuditResult;
  source: 'backend' | 'in-browser';
}

export async function executeAudit(
  rawInput: string,
  purpose: string,
  mode: InputMode
): Promise<AuditResponse> {
  // Always execute in-browser rule engine first so results are guaranteed instant (<100ms)
  const localResult = auditForm(rawInput, purpose, mode);

  // Attempt to ping backend if available with a strict 800ms abort timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);

    const res = await fetch('http://localhost:8000/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: rawInput,
        purpose,
        mode
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.fields) {
        return {
          result: data,
          source: 'backend'
        };
      }
    }
  } catch {
    // Backend offline or unreachable: expected and handled seamlessly
  }

  return {
    result: localResult,
    source: 'in-browser'
  };
}
