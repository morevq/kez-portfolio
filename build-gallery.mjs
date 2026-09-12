import { writeFile } from 'node:fs/promises';
import { scanGalleries } from './gallery.mjs';

const gallery = await scanGalleries();
await writeFile(new URL('./gallery-data.json', import.meta.url), `${JSON.stringify(gallery, null, 2)}\n`);

const total = Object.values(gallery).reduce((sum, items) => sum + items.length, 0);
console.log(`Gallery ready: ${total} work${total === 1 ? '' : 's'}.`);
