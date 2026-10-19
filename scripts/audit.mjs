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

function validateGrammar(g, file){
  const checkItem = (item, where) => {
    if (!item.q && item.k !== 'drag') fail(`${where}: question text missing`);
    if (!item.fb) fail(`${where}: feedback missing`);
    if (!['tap', 'type', 'drag'].includes(item.k)) fail(`${where}: unknown kind "${item.k}"`);
    if (item.k === 'tap') {
      if (!Array.isArray(item.o) || item.o.length < 2) fail(`${where}: tap needs options`);
      else if (!item.o.includes(item.a)) fail(`${where}: answer "${item.a}" is not one of the options`);
    }
    if (item.k === 'type' && typeof item.a !== 'string') fail(`${where}: type needs a string answer`);
    if (item.k === 'drag') {
      if (!Array.isArray(item.w) || !item.w.length) fail(`${where}: drag needs words`);
      else {
        const tokens = item.w.slice().sort().join(' ');
        const answer = String(item.a).trim().split(/\s+/).sort().join(' ');
        if (tokens !== answer) fail(`${where}: drag words do not match the answer`);
      }
    }
  };

  if (Array.isArray(g.steps)) {
    let teaches = 0, finals = 0;
    g.steps.forEach((step, si) => {
      const where = `${file} step ${si}`;
      if (!step || !['teach', 'mini_test', 'final_test'].includes(step.type)) return fail(`${where}: unknown step type`);
      if (step.type === 'teach') {
        teaches++;
        if (!step.title) fail(`${where}: teach card has no title`);
        if (!step.content_fa) fail(`${where}: teach card has no content_fa`);
        (step.examples || []).forEach((ex, ei) => {
          if (!ex.en || !ex.fa) fail(`${where} example ${ei}: needs both en and fa`);
        });
      } else {
        const items = step.items || [];
        if (!items.length) fail(`${where}: no items`);
        if (step.type === 'mini_test' && items.length !== 2) fail(`${where}: mini_test should have 2 items`);
        if (step.type === 'final_test') finals = items.length;
        items.forEach((item, ii) => checkItem(item, `${where} item ${ii}`));
      }
    });
    if (!teaches) fail(`${file}: no teach cards`);
    if (finals !== 10) fail(`${file}: final_test should have 10 items (has ${finals})`);
    return;
  }

  // Legacy format
  if (!Array.isArray(g.explanation) || !g.explanation.length) fail(`${file}: no "steps" and no legacy "explanation"`);
  if (!Array.isArray(g.test) || !g.test.length) fail(`${file}: no "steps" and no legacy "test"`);
}

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
      if (g) validateGrammar(g, lesson.grammar_file);
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
