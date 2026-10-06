import { readdir, stat } from 'node:fs/promises';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const videoExtensions = new Set(['.mp4', '.webm']);

const categories = {
  insomnia: { folder: 'insomnia', labels: { image: 'Artwork', video: 'Animation' } },
  personal: { folder: 'personal', labels: { image: 'Personal artwork', video: 'Animation study' } },
  storyboards: {
    folder: 'storyboards',
    labels: { image: 'Storyboard', video: 'Animatic', pdf: 'Storyboard PDF' },
  },
};

function getType(extension, category) {
  if (imageExtensions.has(extension)) return 'image';
  if (videoExtensions.has(extension)) return 'video';
  if (extension === '.pdf' && category === 'storyboards') return 'pdf';
  return null;
}

function getTitle(filename, category, position) {
  const withoutExtension = filename.slice(0, -extname(filename).length);
  const withoutOrder = withoutExtension.replace(/^\d+[\s._-]*/, '');
  const readable = withoutOrder.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (readable) return readable.replace(/\b\p{L}/gu, (letter) => letter.toUpperCase());

  const defaults = {
    insomnia: 'Insomnia',
    personal: 'Artwork',
    storyboards: 'Storyboard',
  };
  return `${defaults[category]} ${String(position).padStart(2, '0')}`;
}

async function scanCategory(category, config) {
  const directory = join(projectRoot, 'works', config.folder);
  const entries = await readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && !entry.name.startsWith('.'))
    .map((entry) => ({ name: entry.name, extension: extname(entry.name).toLowerCase() }))
    .map((entry) => ({ ...entry, type: getType(entry.extension, category) }))
    .filter((entry) => entry.type)
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

  return Promise.all(files.map(async (file, index) => {
    const position = index + 1;
    const leadingNumber = file.name.match(/^\d+/)?.[0];
    const filePath = join(directory, file.name);
    const fileVersion = Math.trunc((await stat(filePath)).mtimeMs);
    const relativePath = `works/${config.folder}/${encodeURIComponent(file.name)}`;
    return {
      src: `${relativePath}?v=${fileVersion}`,
      title: getTitle(file.name, category, position),
      type: file.type,
      label: config.labels[file.type],
      number: String(leadingNumber ?? position).padStart(2, '0'),
    };
  }));
}

export async function scanGalleries() {
  const entries = await Promise.all(
    Object.entries(categories).map(async ([category, config]) => [category, await scanCategory(category, config)]),
  );
  return Object.fromEntries(entries);
}
