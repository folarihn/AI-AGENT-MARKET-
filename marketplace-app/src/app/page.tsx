import Link from 'next/link';

type StatItemProps = {
  value: string;
  label: string;
};

function StatItem({ value, label }: StatItemProps) {
  return (
    <div className="px-6 py-6">
      <div className="text-[26px] font-medium text-[#f0ede8]">{value}</div>
      <div className="mt-1 text-[12px] text-[rgba(240,237,232,0.4)]">{label}</div>
    </div>
  );
}

type CategoryCardProps = {
  title: string;
  description: string;
  href: string;
  linkLabel: string;
  icon: 'code' | 'edit' | 'database';
};

function CategoryIcon({ icon }: { icon: CategoryCardProps['icon'] }) {
  if (icon === 'code') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f0ede8]" fill="none" aria-hidden="true">
        <path
          d="M9 18L3 12L9 6M15 6L21 12L15 18M14 4L10 20"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === 'edit') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f0ede8]" fill="none" aria-hidden="true">
        <path
          d="M12 20H21M3 17.25V21H6.75L19.81 7.94C20.4 7.35 20.4 6.4 19.81 5.81L18.19 4.19C17.6 3.6 16.65 3.6 16.06 4.19L3 17.25Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#f0ede8]" fill="none" aria-hidden="true">
      <path
        d="M4 6C4 4.9 7.6 4 12 4C16.4 4 20 4.9 20 6C20 7.1 16.4 8 12 8C7.6 8 4 7.1 4 6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 6V12C4 13.1 7.6 14 12 14C16.4 14 20 13.1 20 12V6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12V18C4 19.1 7.6 20 12 20C16.4 20 20 19.1 20 18V12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CategoryCard({ title, description, href, linkLabel, icon }: CategoryCardProps) {
  return (
    <div className="group bg-[#0a0a0a] p-6 transition-colors hover:bg-[#111]">
      <div className="flex items-start gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)]">
          <CategoryIcon icon={icon} />
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-[#f0ede8]">{title}</div>
          <div className="mt-1 text-[12.5px] leading-5 text-[rgba(240,237,232,0.4)]">{description}</div>
          <div className="mt-3">
            <Link
              href={href}
              className="text-[13px] font-medium tracking-[-0.01em] text-[#7c6fff] hover:text-[#a89fff]"
            >
              {linkLabel} →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

type HowStepProps = {
  step: '01' | '02' | '03';
  title: string;
  description: string;
};

function HowStep({ step, title, description }: HowStepProps) {
  return (
    <div className="bg-[#0a0a0a] p-6 transition-colors hover:bg-[#111]">
      <div className="text-[11px] text-[rgba(240,237,232,0.35)]">{step}</div>
      <div className="mt-2 text-[15px] font-medium text-[#f0ede8]">{title}</div>
      <div className="mt-2 text-[13px] leading-6 text-[rgba(240,237,232,0.4)]">{description}</div>
    </div>
  );
}


export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0ede8]">
      <header className="border-b border-[rgba(255,255,255,0.08)] px-6 py-[18px] sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-8">
            <Link href="/" className="inline-flex items-center text-[15px] font-medium tracking-[-0.01em]">
              <span>Agent</span>
              <span className="text-[#7c6fff]">i</span>
            </Link>

            <nav className="flex flex-col gap-2 text-[13px] sm:flex-row sm:items-center sm:gap-6">
              <Link href="/marketplace" className="text-[rgba(240,237,232,0.7)] hover:text-[#f0ede8]">
                Browse agents
              </Link>
              <Link href="/dashboard/creator" className="text-[rgba(240,237,232,0.7)] hover:text-[#f0ede8]">
                For creators
              </Link>
              <Link href="/docs" className="text-[rgba(240,237,232,0.7)] hover:text-[#f0ede8]">
                Docs
              </Link>
            </nav>
          </div>

          <div className="flex">
            <Link
              href="/dashboard/creator"
              className="inline-flex h-10 items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)] px-4 text-[13px] font-medium tracking-[-0.01em] text-[#f0ede8] transition-colors hover:bg-[#111]"
            >
              Submit an agent
            </Link>
          </div>
        </div>
      </header>

      <section className="px-6 pb-16 pt-20 sm:px-12 sm:pb-[80px] sm:pt-[100px]">
        <div className="mx-auto max-w-[760px]">
          <div className="flex items-center gap-2 text-[11px] uppercase text-[rgba(240,237,232,0.7)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7c6fff]" aria-hidden="true" />
            <span>Now in open beta</span>
          </div>

          <h1 className="mt-5 text-[clamp(38px,6vw,62px)] font-medium leading-[1.05] tracking-[-0.03em]">
            The marketplace for{' '}
            <span className="text-[rgba(240,237,232,0.35)] font-medium">trusted</span> AI agents & skills
          </h1>

          <p className="mt-5 text-[16px] leading-7 text-[rgba(240,237,232,0.4)]">
            Every agent and skill is scanned, reviewed, and approved before it goes live. Discover, buy, and run components you can
            actually trust.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/marketplace"
              className="inline-flex h-11 items-center justify-center rounded-md bg-[#7c6fff] px-5 text-[13px] font-medium tracking-[-0.01em] text-[#0a0a0a] transition-colors hover:bg-[#a89fff]"
            >
              Browse agents
            </Link>
            <Link
              href="/dashboard/creator"
              className="inline-flex h-11 items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)] px-5 text-[13px] font-medium tracking-[-0.01em] text-[#f0ede8] transition-colors hover:bg-[#111]"
            >
              Submit your work →
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-2 text-[12px] text-[rgba(240,237,232,0.35)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5DCAA5]" aria-hidden="true" />
            <span>Security scanned · Admin reviewed · License enforced</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[rgba(240,237,232,0.35)]">
            <span>Payments powered by </span>
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#5DCAA5] hover:underline"
            >
              Arc
            </a>
            <span> · USDC native · Sub-second settlement</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-[rgba(240,237,232,0.35)]">
            <span>3 asset types · </span>
            <Link href="/marketplace?itemType=AGENT" className="hover:underline text-[rgba(240,237,232,0.7)]">Agents</Link>
            <span> · </span>
            <Link href="/marketplace?itemType=SKILL" className="hover:underline text-[rgba(240,237,232,0.7)]">Skills</Link>
            <span> · Webhooks</span>
          </div>
        </div>
      </section>

      <section className="border-y border-[rgba(255,255,255,0.07)]">
        <div className="mx-auto max-w-6xl px-6 sm:px-12">
          <div className="grid grid-cols-2 divide-x divide-y divide-[rgba(255,255,255,0.08)] md:grid-cols-4 md:divide-y-0">
            <StatItem value="0" label="Verified agents" />
            <StatItem value="0" label="Verified skills" />
            <StatItem value="<1s" label="Settlement finality" />
            <StatItem value="100%" label="Malware scanned" />
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] uppercase text-[rgba(240,237,232,0.4)]">Browse by category</div>
          <div className="mt-5 rounded-xl bg-[rgba(255,255,255,0.08)] p-px">
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-[rgba(255,255,255,0.08)] md:grid-cols-4">
              <CategoryCard
                title="Developer tools"
                description="Automation for codebases, CI, reviews, and release workflows."
                href="/marketplace?category=DEVTOOLS"
                linkLabel="Browse Devtools"
                icon="code"
              />
              <CategoryCard
                title="Content creation"
                description="Draft, edit, repurpose, and ship writing with consistent style."
                href="/marketplace?category=PRODUCTIVITY"
                linkLabel="Browse Content"
                icon="edit"
              />
              <CategoryCard
                title="Data & research"
                description="Summarize sources, extract signals, and produce research briefs."
                href="/marketplace?category=RESEARCH"
                linkLabel="Browse Research"
                icon="database"
              />
              <CategoryCard
                title="Skills"
                description="Modular capabilities: web search, memory, code execution."
                href="/marketplace?itemType=SKILL"
                linkLabel="Browse Skills"
                icon="code"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] uppercase text-[rgba(240,237,232,0.4)]">Featured items</div>
          <div className="mt-5 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#111] p-12 text-center">
            <h3 className="text-[16px] font-medium text-[#f0ede8]">No items published yet</h3>
            <p className="mt-2 text-[14px] text-[rgba(240,237,232,0.4)]">
              Be the first to submit a verified agent or skill to the marketplace.
            </p>
            <Link
              href="/dashboard/creator"
              className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-[#7c6fff] bg-[rgba(124,111,255,0.12)] px-4 text-[13px] font-medium tracking-[-0.01em] text-[#a89fff] transition-colors hover:bg-[rgba(124,111,255,0.18)]"
            >
              Submit an agent
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-[11px] uppercase text-[rgba(240,237,232,0.4)]">For builders</div>
          <h2 className="mt-4 text-[clamp(28px,4.5vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-[#f0ede8]">
            Skills are the building blocks. Agents are what you ship.
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-[#0a0a0a] p-6 rounded-xl border border-[rgba(255,255,255,0.08)]">
              <div className="text-[14px] font-medium text-[#7c6fff] mb-2">Skills</div>
              <p className="text-[14px] leading-6 text-[rgba(240,237,232,0.4)]">
                Modular capabilities you plug into any agent. Web search, memory, code execution, vector search. 
                Pay per call or buy once. Build faster with reusable primitives.
              </p>
              <Link
                href="/marketplace?itemType=SKILL"
                className="mt-4 inline-flex text-[13px] font-medium text-[#7c6fff] hover:text-[#a89fff]"
              >
                Browse skills →
              </Link>
            </div>
            <div className="bg-[#0a0a0a] p-6 rounded-xl border border-[rgba(255,255,255,0.08)]">
              <div className="text-[14px] font-medium text-[#5DCAA5] mb-2">Agents</div>
              <p className="text-[14px] leading-6 text-[rgba(240,237,232,0.4)]">
                Full workflows built from skills. Scanned, reviewed, and approved. 
                Ready to run locally with license enforcement.
              </p>
              <Link
                href="/marketplace?itemType=AGENT"
                className="mt-4 inline-flex text-[13px] font-medium text-[#5DCAA5] hover:text-[#7DEBB7]"
              >
                Browse agents →
              </Link>
            </div>
          </div>
        </div>
</section>

      <section className="border-t border-[rgba(255,255,255,0.08)] px-6 py-16 sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-[720px]">
            <h2 className="text-[clamp(28px,4.5vw,42px)] font-medium leading-[1.1] tracking-[-0.03em]">
              Built something useful? Publish it here.
            </h2>
            <p className="mt-4 text-[16px] leading-7 text-[rgba(240,237,232,0.4)]">
              Reach developers and teams who need exactly what you built. Set your own price. Get paid directly.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto">
            <Link
              href="/dashboard/creator"
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[#7c6fff] px-5 text-[13px] font-medium tracking-[-0.01em] text-[#0a0a0a] transition-colors hover:bg-[#a89fff] sm:w-[180px]"
            >
              Submit an agent
            </Link>
            <Link
              href="/docs"
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[rgba(255,255,255,0.08)] px-5 text-[13px] font-medium tracking-[-0.01em] text-[#f0ede8] transition-colors hover:bg-[#111] sm:w-[180px]"
            >
              Read the docs →
            </Link>
          </div>
        </div>
      </section>

      <footer className="px-6 py-10 sm:px-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="inline-flex items-center text-[15px] font-medium tracking-[-0.01em]">
            <span>Agent</span>
            <span className="text-[#7c6fff]">i</span>
          </Link>
          <div className="flex flex-col gap-1 text-[12px] text-[rgba(240,237,232,0.35)] sm:flex-row sm:items-center sm:gap-4">
            <span>Safe, verified AI agents · Open beta 2025</span>
            <span className="hidden sm:inline">·</span>
            <a
              href="https://arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              Built on Arc
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
