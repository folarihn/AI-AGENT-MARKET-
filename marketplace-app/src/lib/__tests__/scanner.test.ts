import { describe, it, expect } from 'vitest';
import { scanner } from '../scanner';
import JSZip from 'jszip';

describe('scanner', () => {
  describe('scanSecrets', () => {
    it('detects AWS access key ID', async () => {
      const zip = new JSZip();
      zip.file('test.py', 'AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('FAIL');
      expect(result.secretsFound).toContainEqual(
        expect.stringContaining('SECRET_AWS_ACCESS_KEY_ID')
      );
    });

    it('detects private key block', async () => {
      const zip = new JSZip();
      zip.file('test.py', '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...');
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('FAIL');
      expect(result.secretsFound).toContainEqual(
        expect.stringContaining('SECRET_PRIVATE_KEY_BLOCK')
      );
    });

    it('detects .env file with secrets', async () => {
      const zip = new JSZip();
      zip.file('.env', 'API_KEY=sk-1234567890abcdef\nSECRET=abc123');
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('FAIL');
      expect(result.secretsFound).toContainEqual(
        expect.stringContaining('.env')
      );
    });
  });

  describe('allowlist', () => {
    it('rejects .exe files', async () => {
      const zip = new JSZip();
      zip.file('malware.exe', 'MZ...');
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('FAIL');
      expect(result.disallowedFiles).toContain('malware.exe');
    });

    it('rejects .dll files', async () => {
      const zip = new JSZip();
      zip.file('evil.dll', 'DLL content');
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('FAIL');
      expect(result.disallowedFiles).toContain('evil.dll');
    });

    it('accepts .py files', async () => {
      const zip = new JSZip();
      zip.file('agent.py', 'print("hello")');
      zip.file('agent.json', JSON.stringify({ name: 'test', version: '1.0.0' }));
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('PASS');
      expect(result.disallowedFiles).toHaveLength(0);
    });
  });

  describe('valid package', () => {
    it('passes valid agent package', async () => {
      const zip = new JSZip();
      zip.file('agent.py', 'def main():\n    pass');
      zip.file('agent.json', JSON.stringify({
        name: 'TestAgent',
        version: '1.0.0',
        description: 'A test agent',
        author: 'test@example.com',
      }));
      
      const result = await scanner.scanPackage(await zip.generateAsync({ type: 'arraybuffer' }));
      
      expect(result.status).toBe('PASS');
      expect(result.malwareClean).toBe(true);
    });
  });
});