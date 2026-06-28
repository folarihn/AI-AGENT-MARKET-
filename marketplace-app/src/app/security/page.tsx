import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ScanLine, KeyRound, FileWarning, UserCheck, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Scanning · AgentMarket',
  description: 'How AgentMarket keeps the marketplace safe — automated security scanning, human review, and gated downloads.',
};

const checks: { icon: React.ElementType; title: string; body: string }[] = [
  {
    icon: KeyRound,
    title: 'Secret detection',
    body: 'Every file is scanned for leaked credentials — AWS keys, GitHub/GitLab/Slack tokens, API keys, private-key blocks, and populated .env files. Any match blocks the upload.',
  },
  {
    icon: FileWarning,
    title: 'Dangerous code patterns',
    body: 'Packages calling system commands with dynamic input (e.g. child_process.exec) or referencing known malware / command-and-control domains are rejected automatically.',
  },
  {
    icon: ScanLine,
    title: 'File-type allowlist',
    body: 'Only source and text files are permitted (.py, .js, .ts, .json, .md, .txt, .sh, .yaml, .toml). Binaries, executables, and nested archives are not allowed.',
  },
  {
    icon: UserCheck,
    title: 'Human review',
    body: 'A clean scan is not enough — an admin reviews every submission before it can go live. Anything suspicious is rejected with a reason.',
  },
  {
    icon: Lock,
    title: 'Gated downloads',
    body: 'Paid packages are stored privately and delivered only through short-lived signed links after a verified on-chain purchase. There is no public path to a paid file.',
  },
];

export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Security &amp; Scanning</h1>
          <p className="text-gray-500">How we keep the marketplace safe.</p>
        </div>
      </div>

      <p className="mt-6 text-gray-700">
        AgentMarket runs other people&apos;s code, so trust is the product. Every agent and skill goes
        through an automated security scan <em>and</em> human review before it can be published, and
        paid packages are never publicly accessible. Listings that pass display a{' '}
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-3 w-3" /> Security scan passed
        </span>{' '}
        badge.
      </p>

      <div className="mt-8 space-y-4">
        {checks.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-900">
        <strong>A note on responsibility:</strong> automated scanning catches known-bad patterns, but no
        scan is perfect. Always review a package&apos;s README and declared permissions before running it,
        and report anything that looks off — there&apos;s a <strong>Report</strong> button on every listing.
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/marketplace" className="rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white no-underline hover:bg-indigo-700">
          Browse the marketplace
        </Link>
        <Link href="/submit-guidelines" className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 no-underline hover:bg-gray-50">
          Submission guidelines
        </Link>
      </div>
    </div>
  );
}
