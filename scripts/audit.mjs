#!/usr/bin/env node
// Structural audit for lesson content. Fails on references that would break the app.
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const TOPICS = join(ROOT, 'data', 'topics.json');
const LESSONS_DIR = join(ROOT, 'data', 'lessons');

const errors = [];
const warnings = [];

const fail = (msg) => errors.push(msg);
const warn = (msg) => warnings.push(msg);

const readJson = async (path, label) => {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch (e) {
    fail(`${label}: ${e.message}`);
    return null;
  }
};

const topics = await readJson(TOPICS, 'data/topics.json');
if (!Array.isArray(topics)) {
  fail('data/topics.json must be a JSON array of topics');
}

const seen = new Set();
const referenced = new Set();

for (const [i, t] of (topics || []).entries()) {
  const where = `topics[${i}]${t && t.id ? ` (${t.id})` : ''}`;
  for (const key of ['id', 'title', 'file', 'unit', 'lesson']) {
    if (t == null || t[key] === undefined || t[key] === '') fail(`${where}: missing "${key}"`);
  }
  if (!t || !t.id) continue;
  if (seen.has(t.id)) fail(`${where}: duplicate id`);
  seen.add(t.id);

  if (typeof t.file !== 'string' || !t.file.startsWith('data/lessons/')) {
    fail(`${where}: "file" must live under data/lessons/`);
    continue;
  }
  referenced.add(t.file.split('/').pop());

  const path = join(ROOT, t.file);
  if (!existsSync(path)) {
    fail(`${where}: lesson file not found — ${t.file}`);
    continue;
  }

  const lesson = await readJson(path, t.file);
  if (!lesson) continue;
  if (lesson.id !== t.id) fail(`${t.file}: id "${lesson.id}" does not match topic id "${t.id}"`);
  if (lesson.title !== t.title) warn(`${t.file}: title "${lesson.title}" differs from topic title "${t.title}"`);
  if (!Array.isArray(lesson.questions) || lesson.questions.length === 0) {
    fail(`${t.file}: no "questions" array`);
  }

  if (lesson.grammar_file) {
    if (!existsSync(join(ROOT, lesson.grammar_file))) {
      warn(`${t.file}: grammar_file ${lesson.grammar_file} is missing (Grammar tab shows a placeholder)`);
    } else {
      const g = await readJson(join(ROOT, lesson.grammar_file), lesson.grammar_file);
      if (g) {
        if (!Array.isArray(g.explanation) || !g.explanation.length) fail(`${lesson.grammar_file}: no "explanation"`);
        if (!Array.isArray(g.test) || !g.test.length) fail(`${lesson.grammar_file}: no "test" questions`);
      }
    }
  } else if (!lesson.grammar_notes) {
    warn(`${t.file}: no grammar_file or grammar_notes (Grammar tab shows a placeholder)`);
  }
}

let lessonFiles = [];
try {
  lessonFiles = (await readdir(LESSONS_DIR)).filter((f) => f.endsWith('.json'));
} catch {
  fail('data/lessons/ directory is missing');
}
for (const file of lessonFiles) {
  if (!referenced.has(file)) warn(`data/lessons/${file} is not listed in data/topics.json`);
}

const label = (list) => list.map((m) => `  - ${m}`).join('\n');
if (warnings.length) console.log(`\n${warnings.length} warning(s):\n${label(warnings)}`);
if (errors.length) {
  console.error(`\n${errors.length} error(s):\n${label(errors)}\n`);
  process.exit(1);
}
console.log(`\nOK — ${seen.size} topics, ${lessonFiles.length} lesson files, 0 errors, ${warnings.length} warning(s).`);
