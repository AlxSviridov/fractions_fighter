import { writeFileSync, existsSync } from 'node:fs';
const slug = (process.argv[2] || 'session').replace(/[^a-z0-9-]/gi, '-').toLowerCase();
const stamp = new Date().toISOString().replaceAll(':', '-').slice(0, 19);
const path = `docs/memory/sessions/${stamp}-${slug}.md`;
if (existsSync(path)) throw new Error('Session already exists');
writeFileSync(path, `# Session ${stamp}: ${slug}\n\n## Intent\n\n## Changes\n\n## Decisions and rationale\n\n## Validation and evidence\n\n## Known limitations / blockers\n\n## Exact next steps\n\n## Git and deployment\nRecord branch, tested commit (or previous commit plus pending changes), push status, Firebase project and URL. Never record credentials.\n`);
console.log(path);
