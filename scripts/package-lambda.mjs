/* global Buffer, console */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const bundlePath = resolve(root, 'apps/lambda/dist/bundle.js');
const outputPath = resolve(root, 'apps/lambda/dist/lambda.zip');

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function zipEntry(name, content, offset) {
  const nameBuffer = Buffer.from(name);
  const crc = crc32(content);
  const local = Buffer.alloc(30 + nameBuffer.length);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(0, 6);
  local.writeUInt16LE(0, 8);
  local.writeUInt16LE(0, 10);
  local.writeUInt16LE(0, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(content.length, 18);
  local.writeUInt32LE(content.length, 22);
  local.writeUInt16LE(nameBuffer.length, 26);
  nameBuffer.copy(local, 30);

  const central = Buffer.alloc(46 + nameBuffer.length);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0, 8);
  central.writeUInt16LE(0, 10);
  central.writeUInt16LE(0, 12);
  central.writeUInt16LE(0, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(content.length, 20);
  central.writeUInt32LE(content.length, 24);
  central.writeUInt16LE(nameBuffer.length, 28);
  central.writeUInt32LE(offset, 42);
  nameBuffer.copy(central, 46);
  return { local, central };
}

const bundle = await readFile(bundlePath);
const packageJson = Buffer.from('{"type":"module"}\n');
const entries = [
  ['bundle.js', bundle],
  ['package.json', packageJson],
];
const locals = [];
const centrals = [];
let offset = 0;
for (const [name, content] of entries) {
  const entry = zipEntry(name, content, offset);
  locals.push(Buffer.concat([entry.local, content]));
  centrals.push(entry.central);
  offset += entry.local.length + content.length;
}
const centralDirectory = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 8);
end.writeUInt16LE(entries.length, 10);
end.writeUInt32LE(centralDirectory.length, 12);
end.writeUInt32LE(offset, 16);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, Buffer.concat([...locals, centralDirectory, end]));
console.log(`Created ${outputPath}`);
