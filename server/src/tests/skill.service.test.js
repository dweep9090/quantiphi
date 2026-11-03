import test from 'node:test';
import assert from 'node:assert/strict';
import { computeScore, extractSkills } from '../services/skill.service.js';

test('computes the expected deterministic compatibility score', () => {
  const required = extractSkills('Python, Java, SQL, Machine Learning, and C++');
  const result = computeScore(required, ['Python', 'C++', 'JavaScript', 'SQL']);
  assert.deepEqual(result.matched, ['Python', 'C++', 'SQL']);
  assert.deepEqual(result.missing, ['Java', 'Machine Learning']);
  assert.equal(result.score, 60);
});

test('avoids matching Java inside JavaScript and detects punctuation skills', () => {
  assert.deepEqual(extractSkills('JavaScript developer using C++ and Node.js'), ['JavaScript', 'C++', 'Node.js']);
  assert.ok(extractSkills('Experienced with C# and .NET services').includes('C#'));
  assert.ok(extractSkills('Experienced with C# and .NET services').includes('.NET'));
});
