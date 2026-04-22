#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const path = join(__dirname, '..', 'src', 'data', 'vocabulary.json');

function fail(msg) {
  console.error(`vocabulary.json: ${msg}`);
  process.exit(1);
}

let raw;
try {
  raw = readFileSync(path, 'utf-8');
} catch (e) {
  fail(`cannot read file at ${path}: ${e.message}`);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail(`not valid JSON: ${e.message}`);
}

if (!Array.isArray(data)) fail('top-level value must be an array of categories');

const seenCategoryNames = new Set();
let totalItems = 0;

data.forEach((cat, ci) => {
  const where = `categories[${ci}]`;
  if (!cat || typeof cat !== 'object' || Array.isArray(cat)) fail(`${where} must be an object`);
  if (typeof cat.name !== 'string' || !cat.name) fail(`${where}.name must be a non-empty string`);
  if (seenCategoryNames.has(cat.name)) fail(`duplicate category name "${cat.name}"`);
  seenCategoryNames.add(cat.name);

  if (!Array.isArray(cat.header)) fail(`${where}(${cat.name}).header must be an array`);
  const fieldNames = new Set();
  let questionableCount = 0;
  cat.header.forEach((field, fi) => {
    const fwhere = `${where}(${cat.name}).header[${fi}]`;
    if (!field || typeof field !== 'object') fail(`${fwhere} must be an object`);
    if (typeof field.name !== 'string' || !field.name) {
      fail(`${fwhere}.name must be a non-empty string`);
    }
    if (typeof field.questionable !== 'boolean') {
      fail(`${fwhere}.questionable must be a boolean`);
    }
    if (fieldNames.has(field.name)) fail(`${fwhere}: duplicate field name "${field.name}"`);
    fieldNames.add(field.name);
    if (field.questionable) questionableCount += 1;
  });
  if (questionableCount === 0) {
    console.warn(
      `vocabulary.json: warning — category "${cat.name}" has no questionable fields and will be skipped at runtime.`,
    );
  }

  if (!Array.isArray(cat.groups)) fail(`${where}(${cat.name}).groups must be an array`);
  const seenGroupIds = new Set();
  cat.groups.forEach((group, gi) => {
    const gwhere = `${where}(${cat.name}).groups[${gi}]`;
    if (!group || typeof group !== 'object' || Array.isArray(group)) {
      fail(`${gwhere} must be an object`);
    }
    if (typeof group.id !== 'string' && typeof group.id !== 'number') {
      fail(`${gwhere}.id must be a string or number`);
    }
    if (seenGroupIds.has(group.id)) {
      fail(`${gwhere}: duplicate group id ${JSON.stringify(group.id)} in category "${cat.name}"`);
    }
    seenGroupIds.add(group.id);
    if (!Array.isArray(group.items)) fail(`${gwhere}.items must be an array`);
    group.items.forEach((item, ii) => {
      const iwhere = `${gwhere}.items[${ii}]`;
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        fail(`${iwhere} must be an object`);
      }
      for (const [k, v] of Object.entries(item)) {
        if (typeof v !== 'string') {
          fail(`${iwhere}.${k} must be a string (got ${typeof v})`);
        }
      }
      totalItems += 1;
    });
  });
});

console.log(
  `vocabulary.json OK: ${data.length} categor${data.length === 1 ? 'y' : 'ies'}, ${totalItems} item${totalItems === 1 ? '' : 's'}.`,
);
