import { describe, it, expect } from 'vitest';
import { validateSkillJson, detectAssetTypeAndValidate } from '../skills/validation';
import JSZip from 'jszip';

const validSkillJson = {
  name: 'TestSkill',
  version: '1.0.0',
  type: 'skill',
  description: 'A test skill',
  author: 'test@example.com',
  inputs: [{ name: 'query', type: 'string', required: true }],
  outputs: [{ name: 'result', type: 'string' }],
  runtime: 'python3.11',
  entrypoint: 'main.py',
  permissions: ['network'],
  pricing_model: 'free',
};

describe('skillValidation', () => {
  describe('validateSkillJson', () => {
    it('valid skill.json passes', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify(validSkillJson));
      zip.file('main.py', 'def main():\n    return "hello"');
      
      const findings: { severity: string; rule: string; detail: string }[] = [];
      const result = await validateSkillJson(zip, findings);
      
      expect(result).not.toBeNull();
      expect(findings.filter(f => f.severity === 'ERROR')).toHaveLength(0);
    });

    it('missing required fields fails', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify({ name: 'Test' }));
      
      const findings: { severity: string; rule: string; detail: string }[] = [];
      await validateSkillJson(zip, findings);
      
      const errors = findings.filter(f => f.severity === 'ERROR');
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.map(e => e.rule)).toContain('SCHEMA_VERSION');
    });

    it('invalid pricing_model fails', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify({
        ...validSkillJson,
        pricing_model: 'invalid',
      }));
      
      const findings: { severity: string; rule: string; detail: string }[] = [];
      await validateSkillJson(zip, findings);
      
      const errors = findings.filter(f => f.severity === 'ERROR');
      expect(errors.map(e => e.rule)).toContain('SCHEMA_PRICING_MODEL');
    });

    it('per_call without pricePerCall fails', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify({
        ...validSkillJson,
        pricing_model: 'per_call',
        price_per_call: undefined,
      }));
      
      const findings: { severity: string; rule: string; detail: string }[] = [];
      await validateSkillJson(zip, findings);
      
      const errors = findings.filter(f => f.severity === 'ERROR');
      expect(errors.map(e => e.rule)).toContain('SCHEMA_PRICE_PER_CALL');
    });

    it('per_call with valid price passes', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify({
        ...validSkillJson,
        pricing_model: 'per_call',
        price_per_call: 0.01,
      }));
      
      const findings: { severity: string; rule: string; detail: string }[] = [];
      const result = await validateSkillJson(zip, findings);
      
      expect(result).not.toBeNull();
      expect(findings.filter(f => f.rule === 'SCHEMA_PRICE_PER_CALL')).toHaveLength(0);
    });
  });

  describe('detectAssetTypeAndValidate', () => {
    it('valid skill passes validation', async () => {
      const zip = new JSZip();
      zip.file('skill.json', JSON.stringify(validSkillJson));
      zip.file('main.py', 'def main():\n    pass');
      
      const result = await detectAssetTypeAndValidate(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.assetType).toBe('SKILL');
      expect(result.errors.filter(e => e.severity === 'ERROR')).toHaveLength(0);
    });

    it('package without skill.json fails', async () => {
      const zip = new JSZip();
      zip.file('main.py', 'print("hello")');
      
      const result = await detectAssetTypeAndValidate(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.errors.some(e => e.rule === 'SCHEMA_NO_MANIFEST')).toBe(true);
    });
  });
});