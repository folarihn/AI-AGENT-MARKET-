import JSZip from 'jszip';

export type Finding = {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  rule: string;
  file: string;
  detail: string;
};

export type SkillInput = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  required: boolean;
  default?: unknown;
};

export type SkillOutput = {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
};

export type SkillManifest = {
  name: string;
  version: string;
  type: 'skill';
  description: string;
  author: string;
  inputs: SkillInput[];
  outputs: SkillOutput[];
  runtime: 'python3.11' | 'node20' | 'wasm';
  entrypoint: string;
  permissions: ('network' | 'filesystem' | 'subprocess' | 'none')[];
  pricing_model: 'free' | 'one_time' | 'per_call';
  price_per_call?: number;
  price_one_time?: number;
  tags?: string[];
};

const VALID_RUNTIMES = new Set(['python3.11', 'node20', 'wasm']);
const VALID_TYPES = new Set(['string', 'number', 'boolean', 'array', 'object', 'file']);
const PERMISSIONS_ALLOWED = new Set(['network', 'filesystem', 'subprocess', 'none']);
const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z-.]+)?(?:\+[0-9A-Za-z-.]+)?$/;

function findFile(zip: JSZip, pattern: RegExp): string | null {
  for (const filename of Object.keys(zip.files)) {
    if (pattern.test(filename)) {
      return filename;
    }
  }
  return null;
}

async function readFileAsString(zip: JSZip, filename: string): Promise<string> {
  try {
    return await zip.files[filename].async('string');
  } catch {
    return '';
  }
}

export async function validateSkillJson(
  zip: JSZip,
  findings: Finding[]
): Promise<SkillManifest | null> {
  const name = findFile(zip, /^skill\.json$/i);
  if (!name) {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_SKILL_JSON_MISSING',
      file: '(root)',
      detail: 'skill.json is required',
    });
    return null;
  }

  const raw = await readFileAsString(zip, name);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_SKILL_JSON_INVALID_JSON',
      file: name,
      detail: 'skill.json is not valid JSON',
    });
    return null;
  }

  const requiredFields = ['name', 'version', 'type', 'description', 'author', 'inputs', 'outputs', 'runtime', 'entrypoint', 'permissions', 'pricing_model'] as const;
  for (const field of requiredFields) {
    if (field === 'type' || field === 'permissions') continue;
    if (parsed[field] === undefined || parsed[field] === null || parsed[field] === '') {
      findings.push({
        severity: 'ERROR',
        rule: `SCHEMA_${field.toUpperCase()}`,
        file: name,
        detail: `${field} is required`,
      });
    }
  }

  if (parsed.type !== 'skill') {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_TYPE',
      file: name,
      detail: 'type must be "skill"',
    });
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

  if (!VALID_RUNTIMES.has(parsed.runtime as string)) {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_RUNTIME',
      file: name,
      detail: `runtime must be one of: ${Array.from(VALID_RUNTIMES).join(', ')}`,
    });
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

  const pricingModel = parsed.pricing_model;
  if (!['free', 'one_time', 'per_call'].includes(pricingModel as string)) {
    findings.push({
      severity: 'ERROR',
      rule: 'SCHEMA_PRICING_MODEL',
      file: name,
      detail: 'pricing_model must be "free", "one_time", or "per_call"',
    });
  } else {
    if (pricingModel === 'per_call') {
      if (typeof parsed.price_per_call !== 'number' || parsed.price_per_call <= 0) {
        findings.push({
          severity: 'ERROR',
          rule: 'SCHEMA_PRICE_PER_CALL',
          file: name,
          detail: 'price_per_call must be a positive number for per_call pricing',
        });
      }
    }
    if (pricingModel === 'one_time') {
      if (typeof parsed.price_one_time !== 'number' || parsed.price_one_time <= 0) {
        findings.push({
          severity: 'ERROR',
          rule: 'SCHEMA_PRICE_ONE_TIME',
          file: name,
          detail: 'price_one_time must be a positive number for one_time pricing',
        });
      }
    }
  }

  if (!Array.isArray(parsed.inputs)) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_INPUTS', file: name, detail: 'inputs must be an array' });
  } else {
    if (parsed.inputs.length === 0) {
      findings.push({ severity: 'WARNING', rule: 'SCHEMA_INPUTS', file: name, detail: 'inputs should have at least one entry' });
    }
    for (let i = 0; i < parsed.inputs.length; i++) {
      const input = parsed.inputs[i] as Record<string, unknown>;
      if (typeof input.name !== 'string') {
        findings.push({ severity: 'ERROR', rule: 'SCHEMA_INPUT_NAME', file: name, detail: `inputs[${i}].name must be a string` });
      }
      if (!VALID_TYPES.has(input.type as string)) {
        findings.push({
          severity: 'ERROR',
          rule: 'SCHEMA_INPUT_TYPE',
          file: name,
          detail: `inputs[${i}].type must be one of: ${Array.from(VALID_TYPES).join(', ')}`,
        });
      }
      if (typeof input.required !== 'boolean') {
        findings.push({ severity: 'ERROR', rule: 'SCHEMA_INPUT_REQUIRED', file: name, detail: `inputs[${i}].required must be a boolean` });
      }
    }
  }

  if (!Array.isArray(parsed.outputs)) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_OUTPUTS', file: name, detail: 'outputs must be an array' });
  } else {
    if (parsed.outputs.length === 0) {
      findings.push({ severity: 'WARNING', rule: 'SCHEMA_OUTPUTS', file: name, detail: 'outputs should have at least one entry' });
    }
    for (let i = 0; i < parsed.outputs.length; i++) {
      const output = parsed.outputs[i] as Record<string, unknown>;
      if (typeof output.name !== 'string') {
        findings.push({ severity: 'ERROR', rule: 'SCHEMA_OUTPUT_NAME', file: name, detail: `outputs[${i}].name must be a string` });
      }
      if (!VALID_TYPES.has(output.type as string)) {
        findings.push({
          severity: 'ERROR',
          rule: 'SCHEMA_OUTPUT_TYPE',
          file: name,
          detail: `outputs[${i}].type must be one of: ${Array.from(VALID_TYPES).join(', ')}`,
        });
      }
    }
  }

  if (parsed.tags && !Array.isArray(parsed.tags)) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_TAGS', file: name, detail: 'tags must be an array' });
  }

  const entrypoint = parsed.entrypoint as string;
  if (typeof entrypoint !== 'string' || !entrypoint.trim()) {
    findings.push({ severity: 'ERROR', rule: 'SCHEMA_ENTRYPOINT', file: name, detail: 'entrypoint is required' });
  } else {
    const entrypointPattern = new RegExp(`^${entrypoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
    const entrypointExists = Object.keys(zip.files).some((f) => entrypointPattern.test(f));
    if (!entrypointExists) {
      findings.push({
        severity: 'ERROR',
        rule: 'SCHEMA_ENTRYPOINT_FILE',
        file: name,
        detail: `entrypoint file "${entrypoint}" not found in archive`,
      });
    }
  }

  return parsed as unknown as SkillManifest;
}

export type AssetType = 'AGENT' | 'SKILL';

interface ScanResult {
  assetType: AssetType;
  manifest: SkillManifest | null;
  errors: Finding[];
}

export async function detectAssetTypeAndValidate(
  fileBuffer: ArrayBuffer
): Promise<ScanResult> {
  const zip = await JSZip.loadAsync(fileBuffer);
  const files = Object.keys(zip.files).map((f) => f.toLowerCase());
  
  const hasAgentJson = files.some((f) => f.endsWith('agent.json'));
  const hasSkillJson = files.some((f) => f.endsWith('skill.json'));
  
  const errors: Finding[] = [];
  
  if (hasAgentJson && hasSkillJson) {
    errors.push({
      severity: 'ERROR',
      rule: 'SCHEMA_CONFLICT',
      file: '(root)',
      detail: 'Cannot contain both agent.json and skill.json',
    });
    return { assetType: 'AGENT', manifest: null, errors };
  }
  
  if (!hasAgentJson && !hasSkillJson) {
    errors.push({
      severity: 'ERROR',
      rule: 'SCHEMA_NO_MANIFEST',
      file: '(root)',
      detail: 'Package must contain either agent.json or skill.json',
    });
    return { assetType: 'AGENT', manifest: null, errors };
  }
  
  if (hasSkillJson) {
    const manifest = await validateSkillJson(zip, errors);
    if (manifest) {
      return { assetType: 'SKILL', manifest, errors };
    }
    return { assetType: 'SKILL', manifest: null, errors };
  }
  
  return { assetType: 'AGENT', manifest: null, errors };
}