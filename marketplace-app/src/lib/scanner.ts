import JSZip from 'jszip';

// Basic Allowlist: common code and config files
const ALLOWED_EXTENSIONS = [
  '.py', '.js', '.ts', '.json', '.md', '.txt', '.yaml', '.yml', '.dockerfile', 'dockerfile',
  '.png', '.jpg', '.jpeg', '.gif', '.html', '.css', '.env.example'
];

// Basic Secrets Patterns (Mock)
const SECRET_PATTERNS = [
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Private Key', regex: /-----BEGIN PRIVATE KEY-----/ },
];

export const scanner = {
  scanPackage: async (fileBuffer: ArrayBuffer) => {
    const zip = await JSZip.loadAsync(fileBuffer);
    const files = Object.keys(zip.files);
    
    const disallowedFiles: string[] = [];
    const secretsFound: string[] = [];
    let malwareClean = true; // Mock: always clean unless we add a specific trigger

    for (const filename of files) {
      if (zip.files[filename].dir) continue;

      // 1. Check Allowlist
      const ext = '.' + filename.split('.').pop()?.toLowerCase();
      const isAllowed = ALLOWED_EXTENSIONS.some(allowed => filename.toLowerCase().endsWith(allowed));
      
      // Special check for files without extension (like Dockerfile) or hidden files
      const isSpecial = filename.toLowerCase().endsWith('dockerfile') || filename.startsWith('.');
      
      if (!isAllowed && !isSpecial) {
         // Check if it's strictly disallowed (like .exe, .dll)
         if (filename.endsWith('.exe') || filename.endsWith('.dll') || filename.endsWith('.sh')) {
            disallowedFiles.push(filename);
         }
      }

      // 2. Check Secrets
      // Limit file size check to avoid memory issues on large files
      const content = await zip.files[filename].async('string');
      
      for (const pattern of SECRET_PATTERNS) {
        if (pattern.regex.test(content)) {
          secretsFound.push(`${pattern.name} in ${filename}`);
        }
      }
    }

    // Mock Malware Scan (Randomly fail if filename contains "virus")
    if (files.some(f => f.includes('virus'))) {
      malwareClean = false;
    }

    const passed = malwareClean && secretsFound.length === 0 && disallowedFiles.length === 0;

    return {
      malwareClean,
      secretsFound,
      disallowedFiles,
      status: passed ? 'PASS' : 'FAIL' as 'PASS' | 'FAIL',
    };
  }
};
