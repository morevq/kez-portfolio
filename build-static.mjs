import { cp, mkdir, rm } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const dist = `${projectRoot}/dist`;
const files = ['index.html', 'styles.css', 'script.js', 'gallery-data.json'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

await Promise.all(files.map((file) => cp(`${projectRoot}/${file}`, `${dist}/${file}`)));
await cp(`${projectRoot}/works`, `${dist}/works`, {
  recursive: true,
  filter: (source) => !['.DS_Store', '.gitkeep'].includes(basename(source)),
});

console.log('Static site ready in dist/.');
