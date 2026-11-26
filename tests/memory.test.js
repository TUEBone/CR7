import test from 'node:test';
import assert from 'node:assert/strict';
import {MemoryMatch} from '../js/memory.js';

test('all three board sizes contain exactly two copies of each motif', () => {
  for (const [size, count] of [24, 50, 60].entries()) {
    const match = new MemoryMatch({size, opponent: 'person', level: 'normal'});
    assert.equal(match.cards.length, count);
    const counts = new Map();
    for (const motif of match.cards) counts.set(motif, (counts.get(motif) ?? 0) + 1);
    assert.equal(counts.size, count / 2);
    assert.ok([...counts.values()].every(copies => copies === 2));
  }
});

test('a miss changes turns, a match scores for the current player and keeps their turn', () => {
  const match = new MemoryMatch({size: 0, opponent: 'person', level: 'normal'}, () => .999);
  assert.equal(match.reveal(0), true);
  assert.equal(match.reveal(0), false);
  assert.equal(match.reveal(2), true);
  assert.equal(match.reveal(3), false);
  match.resolve();
  assert.equal(match.turn, 1);
  for (let i = 0; i < match.cards.length; i += 2) {
    assert.equal(match.reveal(i), true);
    assert.equal(match.reveal(i + 1), true);
    match.resolve();
    assert.equal(match.turn, 1);
  }
  assert.deepEqual(match.scores, [0, 12]);
  assert.equal(match.done, true);
});

test('the computer memorizes revealed motifs within the chosen capacity and recognizes a known pair', () => {
  for (const [level, retained] of [['easy', 2], ['normal', 10], ['hard', 12]]) {
    const match = new MemoryMatch({size: 0, opponent: 'computer', level}, () => .999);
    for (let i = 0; i < 6; i++) {
      match.reveal(i * 2);
      match.reveal(23 - i * 2);
      match.resolve();
    }
    assert.equal(match.seen.size, retained);
    assert.equal(match.seen.has(1), false);
    match.reveal(12);
    if (level === 'hard') assert.equal(match.computerPick(), 13);
    else assert.ok(match.available(match.computerPick()));
  }
});
