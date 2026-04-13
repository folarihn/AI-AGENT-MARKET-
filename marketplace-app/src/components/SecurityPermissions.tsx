'use client';

import { ShieldCheck, ShieldAlert, Info, AlertTriangle, CheckCircle, UserCheck, TerminalSquare, Globe, HardDrive } from 'lucide-react';

export type ScanSummary = {
  createdAt: string;
  status: 'PASS' | 'FAIL';
  malwareClean: boolean;
  secretsFound: string[];
  disallowedFiles: string[];
  findings: string[];
};

export default function SecurityPermissions({
  scan,
  permissions,
  creatorEmailVerified,
}: {
  scan: ScanSummary | null;
  permissions: { network: boolean; filesystem: boolean; subprocess: boolean };
  creatorEmailVerified: boolean;
}) {
  const scanDate = scan ? new Date(scan.createdAt).toLocaleDateString() : null;
  const derivedFindings = scan ? toFindings(scan) : [];
  const hasWarningsOrErrors = derivedFindings.some((f) => f.severity !== 'INFO');

  const permissionItems = toPermissionItems(permissions);

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          Security & permissions
        </h2>
        <div className="flex items-center gap-2">
          {creatorEmailVerified ? (
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs font-medium">
              <UserCheck className="h-3 w-3 mr-1" />
              Creator email verified
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-gray-100 text-gray-700 px-2 py-1 text-xs font-medium">
              <ShieldAlert className="h-3 w-3 mr-1" />
              Creator unverified
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-sm font-medium text-gray-900">Security scan</div>
            <div className="text-sm text-gray-600">
              {scanDate ? `Last scanned on ${scanDate}` : 'No scan results available'}
            </div>
          </div>
          {scan ? (
            scan.status === 'PASS' && !hasWarningsOrErrors ? (
              <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-3 py-1 text-sm font-medium">
                <CheckCircle className="h-4 w-4 mr-2" />
                Security scan passed
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-900 px-3 py-1 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review findings
              </span>
            )
          ) : null}
        </div>

        {scan ? (
          <div className="space-y-2">
            {derivedFindings.length === 0 ? (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                No findings reported.
              </div>
            ) : (
              derivedFindings.map((f, idx) => (
                <div
                  key={`${f.rule}-${idx}`}
                  className={`rounded-md border px-3 py-2 text-sm flex items-start gap-2 ${
                    f.severity === 'ERROR'
                      ? 'border-red-200 bg-red-50 text-red-900'
                      : f.severity === 'WARNING'
                        ? 'border-yellow-200 bg-yellow-50 text-yellow-900'
                        : 'border-gray-200 bg-gray-50 text-gray-800'
                  }`}
                >
                  {f.severity === 'ERROR' ? (
                    <ShieldAlert className="h-4 w-4 mt-0.5" />
                  ) : f.severity === 'WARNING' ? (
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                  ) : (
                    <Info className="h-4 w-4 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium">{f.rule}</div>
                    <div className="opacity-90">{f.detail}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        <div className="pt-2 border-t">
          <div className="text-sm font-medium text-gray-900 mb-2">Declared permissions</div>
          <div className="space-y-2">
            {permissionItems.length === 0 ? (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <Info className="h-4 w-4 text-gray-400" />
                This agent runs in a sandboxed environment.
              </div>
            ) : (
              permissionItems.map((p) => (
                <div key={p.key} className="flex items-start gap-2 text-sm text-gray-800">
                  {p.key === 'network' ? (
                    <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                  ) : p.key === 'filesystem' ? (
                    <HardDrive className="h-4 w-4 text-gray-400 mt-0.5" />
                  ) : (
                    <TerminalSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                  )}
                  <div>{p.label}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type DerivedFinding = { severity: 'ERROR' | 'WARNING' | 'INFO'; rule: string; detail: string };

function toFindings(scan: ScanSummary): DerivedFinding[] {
  const results: DerivedFinding[] = [];

  if (scan.status === 'FAIL') {
    results.push({ severity: 'ERROR', rule: 'SCAN_FAILED', detail: 'Security scan did not pass.' });
  } else {
    results.push({ severity: 'INFO', rule: 'SCAN_COMPLETED', detail: 'Security scan completed.' });
  }

  if (!scan.malwareClean) {
    results.push({ severity: 'ERROR', rule: 'MALWARE', detail: 'Potential malware indicators found.' });
  }

  for (const s of scan.secretsFound || []) {
    results.push({ severity: 'ERROR', rule: 'SECRET', detail: s });
  }
  for (const f of scan.disallowedFiles || []) {
    results.push({ severity: 'ERROR', rule: 'DISALLOWED_FILE', detail: f });
  }

  for (const raw of scan.findings || []) {
    const lower = raw.toLowerCase();
    if (lower.startsWith('secret:')) results.push({ severity: 'ERROR', rule: 'SECRET', detail: raw.replace(/^Secret:\s*/i, '') });
    else if (lower.startsWith('disallowed:')) results.push({ severity: 'ERROR', rule: 'DISALLOWED_FILE', detail: raw.replace(/^Disallowed:\s*/i, '') });
    else if (lower.includes('malware')) results.push({ severity: 'WARNING', rule: 'MALWARE_INDICATOR', detail: raw });
    else results.push({ severity: 'INFO', rule: 'INFO', detail: raw });
  }

  const uniq = new Map<string, DerivedFinding>();
  for (const r of results) {
    uniq.set(`${r.severity}:${r.rule}:${r.detail}`, r);
  }
  return Array.from(uniq.values());
}

function toPermissionItems(permissions: { network: boolean; filesystem: boolean; subprocess: boolean }) {
  const items: Array<{ key: 'network' | 'filesystem' | 'subprocess'; label: string }> = [];
  if (permissions.network) items.push({ key: 'network', label: 'This agent makes external network requests' });
  if (permissions.filesystem) items.push({ key: 'filesystem', label: 'This agent reads/writes your local file system' });
  if (permissions.subprocess) items.push({ key: 'subprocess', label: 'This agent can run shell commands' });
  return items;
}
