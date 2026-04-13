import JSZip from 'jszip';

export type Finding = {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  rule: string;
  file: string;
  detail: string;
};

const ALLOWED_EXTENSIONS = new Set([
  '.py', '.js', '.ts', '.json', '.md', '.txt', '.sh', '.yaml', '.yml', '.toml', 'requirements.txt',
]);

const C2_DOMAINS = ['examplemalware.com', 'darkrat.net', 'badc2.co'];

const SECRET_PATTERNS: { rule: string; regex: RegExp }[] = [
  { rule: 'SECRET_AWS_ACCESS_KEY_ID', regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { rule: 'SECRET_AWS_SECRET_ACCESS_KEY', regex: /\b(?:(?:aws)?_?(?:secret)?_?(?:access)?_?key(?:_id)?)\s*[:=]\s*([A-Za-z0-9\/+=]{40})\b/i },
  { rule: 'SECRET_GITHUB_TOKEN', regex: /\bgh[pousr]_[A-Za-z0-9_]{36}\b/ },
  { rule: 'SECRET_GITLAB_PAT', regex: /\bglpat-[A-Za-z0-9_-]{20}\b/ },
  { rule: 'SECRET_SLACK_TOKEN', regex: /\bxox[baprs]-[A-Za-z0-9-]{10,48}\b/ },
  { rule: 'SECRET_OPENAI_API_KEY', regex: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { rule: 'SECRET_PRIVATE_KEY_BLOCK', regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
];

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;
const PERMISSIONS_ALLOWED = new Set(['network', 'filesystem', 'subprocess', 'none']);

async function readFileAsString(zip: JSZip, filename: string): Promise<string> {
  try {
    return await zip.files[filename].async('string');
  } catch {
    return '';
  }
}

function hasAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  if (lower.endsWith('requirements.txt')) return true;
  const idx = lower.lastIndexOf('.');
  const ext = idx >= 0 ? lower.slice(idx) : '';
  return ALLOWED_EXTENSIONS.has(ext);
}

async function scanSecrets(content: string, filename: string, findings: Finding[]) {
  for (const { rule, regex } of SECRET_PATTERNS) {
    if (regex.test(content)) {
      findings.push({
        severity: 'ERROR',
        rule,
        file: filename,
        detail: `Potential secret detected`,
      });
    }
  }

  if (filename.toLowerCase().includes('.env')) {
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
      if (m) {
        const val = m[2].trim().replace(/^['"]|['"]$/g, '');
        if (val && !/^(?:placeholder|changeme|example|test)$/i.test(val)) {
          findings.push({
            severity: 'ERROR',
            rule: 'SECRET_ENV_VALUE',
            file: filename,
            detail: `Env var ${m[1]} appears to have a real value`,
          });
        }
      }
    }
  }
}

async function scanSuspicious(content: string, filename: string, findings: Finding[]) {
  if (/\beval\s*\((?!\s*['"`][^'"`]*['"`]\s*\))/.test(content)) {
    findings.push({
      severity: 'WARNING',
      rule: 'DANGEROUS_EVAL',
      file: filename,
      detail: 'Use of eval() with non-literal input',
    });
  }

  const execMatch = content.match(/\bchild_process\.(exec|execSync)\s*\(([^)]+)\)/);
  if (execMatch) {
    const arg = execMatch[2] || '';
    const isLiteral = /^['"`][^'"`]*['"`]$/.test(arg.trim());
    findings.push({
      severity: isLiteral ? 'WARNING' : 'ERROR',
      rule: 'CHILD_PROCESS_EXEC',
      file: filename,
      detail: `child_process.${execMatch[1]} called with ${isLiteral ? 'literal' : 'dynamic'} input`,
    });
  }

  for (const domain of C2_DOMAINS) {
    if (content.includes(domain)) {
      findings.push({
        severity: 'ERROR',
        rule: 'MALWARE_C2',
        file: filename,
        detail: `Reference to known C2 domain: ${domain}`,
      });
    }
  }
}

async function validateAgentJson(zip: JSZip, findings: Finding[]) {
  const name = Object.keys(zip.files).find((f) => f.endsWith('agent.json'));
  if (!name) {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_AGENT_JSON_MISSING',
      file: '(root)',
      detail: 'agent.json is required',
    });
    return;
  }

  const raw = await readFileAsString(zip, name);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_AGENT_JSON_INVALID_JSON',
      file: name,
      detail: 'agent.json is not valid JSON',
    });
    return;
  }

  if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_NAME', file: name, detail: 'name must be a non-empty string' });
  }
  if (typeof parsed.version !== 'string' || !SEMVER_REGEX.test(parsed.version)) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_VERSION', file: name, detail: 'version must be valid semver' });
  }
  if (typeof parsed.author !== 'string' || !parsed.author.trim()) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_AUTHOR', file: name, detail: 'author must be a non-empty string' });
  }
  if (!Array.isArray(parsed.permissions)) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_PERMISSIONS', file: name, detail: 'permissions must be an array' });
  } else {
    for (const p of parsed.permissions) {
      if (!PERMISSIONS_ALLOWED.has(String(p))) {
        findings.push({
          severity: 'ERROR',
          rule: 'SCHEMA_PERMISSIONS',
          file: name,
          detail: `Invalid permission "${p}". Allowed: ${Array.from(PERMISSIONS_ALLOWED).join(', ')}`,
        });
      }
    }
  }
}

export const scanner = {
  scanZip: async (zip: JSZip, opts?: { archiveByteLength?: number }) => {
    const findings: Finding[] = [];
    const files = Object.keys(zip.files).filter((f) => !zip.files[f].dir);

    if (opts?.archiveByteLength !== undefined) {
      if (opts.archiveByteLength > 50 * 1024 * 1024) {
        findings.push({
          severity: 'ERROR',
          rule: 'PACKAGE_OVERSIZE',
          file: '(archive)',
          detail: 'Archive size exceeds 50MB limit',
        });
      } else if (opts.archiveByteLength > 10 * 1024 * 1024) {
        findings.push({
          severity: 'WARNING',
          rule: 'PACKAGE_LARGE',
          file: '(archive)',
          detail: 'Archive size exceeds 10MB (may be flagged for manual review)',
        });
      }
    }

    for (const filename of files) {
      if (!hasAllowedExtension(filename)) {
        findings.push({
          severity: 'ERROR',
          rule: 'ALLOWLIST',
          file: filename,
          detail: 'File extension not allowed by policy',
        });
        continue;
      }

      const content = await readFileAsString(zip, filename);
      await scanSecrets(content, filename, findings);
      await scanSuspicious(content, filename, findings);
    }

    await validateAgentJson(zip, findings);

    const errors = findings.some((f) => f.severity === 'ERROR');
    return { passed: !errors, findings };
  },

  scanPackage: async (fileBuffer: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(fileBuffer);
    const { passed, findings } = await scanner.scanZip(zip, { archiveByteLength: fileBuffer.byteLength });

    const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
    const malwareClean = !findings.some((f) => ['MALWARE_C2', 'DANGEROUS_EVAL', 'CHILD_PROCESS_EXEC'].includes(f.rule) && f.severity !== 'INFO');
    const secretsFound = findings.filter((f) => f.rule.startsWith('SECRET_')).map((f) => `${f.rule} in ${f.file}`);
    const disallowedFiles = findings.filter((f) => f.rule === 'ALLOWLIST').map((f) => f.file);

    return {
      malwareClean,
      secretsFound,
      disallowedFiles,
      status,
    };
  },
};
