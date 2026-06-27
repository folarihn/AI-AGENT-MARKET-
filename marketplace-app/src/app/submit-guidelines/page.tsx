import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileArchive, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Submission Guidelines · AgentMarket',
  description: 'Rules and requirements for uploading an agent or skill to AgentMarket.',
};

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700">
      {children}
    </code>
  );
}

export default function SubmissionGuidelinesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/dashboard/creator/submit"
        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft size={15} /> Back to Submit
      </Link>

      <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900">Submission Guidelines</h1>
      <p className="mt-2 text-gray-600">
        Everything your package needs to pass validation and the security scan. The same rules are
        enforced automatically when you upload — meeting them here means a clean submission.
      </p>

      {/* General */}
      <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <FileArchive size={18} className="text-indigo-600" /> General requirements
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>• Upload a single <Code>.zip</Code> archive, <strong>50 MB max</strong>.</li>
          <li>• The zip must contain a <Code>README.md</Code>.</li>
          <li>• It must contain <strong>exactly one</strong> manifest: <Code>agent.json</Code> <em>or</em> <Code>skill.json</Code> — never both, never neither. That file decides the listing type.</li>
          <li>• Put the manifest and entrypoint at the <strong>root of the zip</strong> (not inside a sub-folder).</li>
          <li>• You must be a <strong>Creator</strong> (buyers get a one-click upgrade on the Submit page). Limit: 10 uploads per hour.</li>
        </ul>
      </section>

      {/* Allowed files */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">Allowed file types</h2>
        <p className="mt-2 text-sm text-gray-700">
          Every file in the zip is scanned. Only these extensions are allowed — anything else (e.g.
          <Code>.exe</Code>, <Code>.png</Code>, nested <Code>.zip</Code>) gets the package rejected:
        </p>
        <div className="mt-3 rounded-lg bg-gray-900 p-3 font-mono text-xs text-gray-100">
          .py &nbsp; .js &nbsp; .ts &nbsp; .json &nbsp; .md &nbsp; .txt &nbsp; .sh &nbsp; .yaml &nbsp; .yml &nbsp; .toml &nbsp; requirements.txt
        </div>
      </section>

      {/* agent.json */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">For an Agent — <Code>agent.json</Code></h2>
        <p className="mt-2 text-sm font-medium text-gray-700">Required fields:</p>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
          <li>• <Code>name</Code> — non-empty string</li>
          <li>• <Code>version</Code> — valid semver, e.g. <Code>1.0.0</Code></li>
          <li>• <Code>author</Code> — non-empty string</li>
          <li>• <Code>permissions</Code> — array of only <Code>network</Code>, <Code>filesystem</Code>, <Code>subprocess</Code>, <Code>none</Code></li>
        </ul>
        <p className="mt-3 text-sm text-gray-500">Optional: <Code>display_name</Code>, <Code>description</Code>, <Code>tags</Code>.</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">{`{
  "name": "my-agent",
  "display_name": "My Agent",
  "description": "What it does.",
  "version": "1.0.0",
  "author": "Your Name",
  "permissions": ["none"],
  "tags": ["automation"]
}`}</pre>
      </section>

      {/* skill.json */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-bold text-gray-900">For a Skill — <Code>skill.json</Code> (stricter)</h2>
        <p className="mt-2 text-sm font-medium text-gray-700">Required fields:</p>
        <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
          <li>• <Code>name</Code>, <Code>version</Code> (semver), <Code>type</Code> (must be <Code>&quot;skill&quot;</Code>), <Code>description</Code>, <Code>author</Code></li>
          <li>• <Code>runtime</Code> — one of <Code>python3.11</Code>, <Code>node20</Code>, <Code>wasm</Code></li>
          <li>• <Code>entrypoint</Code> — a filename that <strong>exists in the zip</strong> (e.g. <Code>main.py</Code>)</li>
          <li>• <Code>permissions</Code> — array of <Code>network</Code>/<Code>filesystem</Code>/<Code>subprocess</Code>/<Code>none</Code></li>
          <li>• <Code>inputs</Code> — array of <Code>{`{ name, type, required }`}</Code> (type ∈ string/number/boolean/array/object/file)</li>
          <li>• <Code>outputs</Code> — array of <Code>{`{ name, type }`}</Code></li>
          <li>• <Code>pricing_model</Code> — <Code>free</Code>, <Code>one_time</Code> (needs <Code>price_one_time</Code> &gt; 0), or <Code>per_call</Code> (needs <Code>price_per_call</Code> &gt; 0)</li>
        </ul>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-gray-900 p-4 text-xs leading-relaxed text-gray-100">{`{
  "name": "text-summarizer",
  "version": "1.0.0",
  "type": "skill",
  "description": "Summarizes text.",
  "author": "Your Name",
  "runtime": "python3.11",
  "entrypoint": "main.py",
  "permissions": ["none"],
  "pricing_model": "free",
  "tags": ["text", "nlp"],
  "inputs":  [{ "name": "text", "type": "string", "required": true }],
  "outputs": [{ "name": "summary", "type": "string" }]
}`}</pre>
      </section>

      {/* Rejected */}
      <section className="mt-6 rounded-2xl border border-red-200 bg-red-50/60 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <XCircle size={18} className="text-red-500" /> Automatically rejected
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-gray-700">
          <li>• <strong>Secrets in any file</strong> — AWS keys, GitHub/GitLab/Slack tokens, <Code>sk-…</Code> API keys, private-key blocks, or a <Code>.env</Code> with real values.</li>
          <li>• <strong><Code>child_process.exec</Code></strong> called with dynamic (non-literal) input.</li>
          <li>• References to known malware / C2 domains.</li>
          <li>• Disallowed file extensions, or an archive over 50 MB.</li>
        </ul>
      </section>

      {/* Flow */}
      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900">
          <ShieldCheck size={18} className="text-emerald-600" /> What happens after you submit
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-gray-700">
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> Your package is scanned for security issues.</li>
          <li className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> If it passes, it enters <strong>Pending Review</strong>; an admin approves it and it goes <strong>live</strong>.</li>
          <li className="flex gap-2"><XCircle size={16} className="mt-0.5 shrink-0 text-red-500" /> If the scan finds critical issues, it&apos;s auto-rejected with the reasons.</li>
        </ol>
      </section>

      <div className="mt-8 flex justify-center">
        <Link
          href="/dashboard/creator/submit"
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Go to Submit
        </Link>
      </div>
    </div>
  );
}
