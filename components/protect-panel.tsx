'use client';

import { useEffect, useState } from 'react';
import type { ApiClient, ProtectCheck } from '@/lib/api/client';

type Row = ProtectCheck & { id: string; kind: string; subject_id: string };

const KIND: Record<string, string> = { plan: 'Payment', agent_payment: 'AI agent payment', merchant_invoice: 'Shop order' };
const VERDICT = {
  pay: { label: 'Safe', tone: 'bg-[var(--positive)]/12 text-[var(--positive)]' },
  ask: { label: 'You checked', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  block: { label: 'Blocked', tone: 'bg-red-500/12 text-red-600 dark:text-red-400' },
} as const;

/** Every payment CentralMonie Protect checked: SERV Reasoning's answer and the reasons, newest first. */
export function ProtectPanel({ api }: { api: ApiClient }) {
  const [data, setData] = useState<{ enabled: boolean; checks: Row[] } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  useEffect(() => {
    void api.protectChecks().then(setData).catch(() => setData({ enabled: false, checks: [] }));
  }, [api]);
  const counts = { pay: 0, ask: 0, block: 0 };
  for (const check of data?.checks ?? []) counts[check.verdict] += 1;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="page-title">Protect</h1>
        <p className="text-sm text-[var(--muted)]">Before money leaves, SERV Reasoning reads what led to the payment and checks it against what the bank says. Here is every check, with its reasons.</p>
      </div>
      {data && !data.enabled && <p className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 text-sm text-[var(--muted)]">Protect is off on this server.</p>}
      <div className="grid grid-cols-3 gap-3">
        {(['pay', 'ask', 'block'] as const).map((verdict) => (
          <div key={verdict} className="flex flex-col gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4">
            <span className="text-xs text-[var(--muted)]">{verdict === 'pay' ? 'Passed' : verdict === 'ask' ? 'Needed you' : 'Blocked'}</span>
            <span className="text-2xl font-semibold">{counts[verdict]}</span>
          </div>
        ))}
      </div>
      <ul className="flex flex-col divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)]">
        {data?.checks.length === 0 && <li className="p-6 text-center text-sm text-[var(--muted)]">No checks yet. Your next payment will appear here.</li>}
        {data?.checks.map((check) => {
          const look = VERDICT[check.verdict];
          const label = check.verdict === 'ask' && !check.acknowledged ? 'Waiting for you' : look.label;
          return (
            <li key={check.id}>
              <button type="button" className="flex w-full items-start justify-between gap-4 p-4 text-left hover:bg-[var(--surface-2)]" aria-expanded={open === check.id} onClick={() => setOpen(open === check.id ? null : check.id)}>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-medium">{KIND[check.kind] ?? check.kind}</span>
                  <span className="truncate text-sm text-[var(--muted)]">{check.summary ?? 'No summary.'}</span>
                  <span className="text-xs text-[var(--muted)]">{new Date(check.checked_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}{check.seconds !== null ? ` · ${check.seconds}s` : ''}</span>
                </span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${look.tone}`}>{label}</span>
              </button>
              {open === check.id && (
                <div className="flex flex-col gap-2 px-4 pb-4 text-sm">
                  <p>{check.summary}</p>
                  {check.question && <p className="font-medium">{check.question}</p>}
                  {check.signals.map((signal) => (
                    <p key={signal.name + signal.evidence} className="text-[var(--muted)]"><span className="font-medium text-[var(--foreground)]">{signal.name}</span> ({signal.severity}): {signal.evidence}</p>
                  ))}
                  <p className="text-xs text-[var(--muted)]">SERV said: {check.serv_verdict ?? 'no answer'}{check.model ? ` · ${check.model}` : ''}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
