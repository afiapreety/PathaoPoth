import test from 'node:test';
import assert from 'node:assert/strict';
import { seedWorkspace, people, act, allowed, projectCase, summarizeNote, forecast, sla } from './workflow.mjs';

test('scripted case passes through Mirpur, care and destination with continuous ownership', () => {
  const w = seedWorkspace(), [hub, rider, care, destination] = people;
  const c = act(w, hub, 'create', { parcelId: 'PP-826500', type: 'Refused delivery', hub: hub.hub, lastHandler: rider.name });
  assert.equal(c.cod, 2300);
  act(w, rider, 'note', { id: c.id, note: '3 bar gesi, phone off. Shondha 7tar por thakbe. address clear na.' });
  act(w, hub, 'analyze', { id: c.id });
  assert.equal(c.analysis.attempts, 3);
  act(w, hub, 'transfer', { id: c.id, recipientId: care.id });
  assert.equal(c.owner.id, hub.id);
  assert.throws(() => act(w, destination, 'acknowledge', { id: c.id }));
  act(w, care, 'acknowledge', { id: c.id });
  assert.equal(c.owner.id, care.id);
  assert.throws(() => act(w, care, 'confirm', { id: c.id, nextStep: c.analysis.recommendation }));
  act(w, care, 'confirm', { id: c.id, nextStep: c.analysis.recommendation, reviewed: true });
  act(w, care, 'transfer', { id: c.id, recipientId: destination.id });
  assert.equal(c.owner.id, care.id);
  act(w, destination, 'acknowledge', { id: c.id });
  assert.equal(c.owner.id, destination.id);
  assert.equal(c.hub, destination.hub);
  act(w, destination, 'resolve', { id: c.id, outcome: 'Delivered' });
  assert.equal(sla(c).state, 'Resolved');
  assert.equal(c.history.filter(e => e.kind === 'transfer-acknowledged').length, 2);
});
test('sender projection excludes notes, phones, internal events and ownership fields', () => {
  const c = seedWorkspace().cases[0], sender = people[5];
  assert.equal(allowed(c, sender), true);
  const view = projectCase(c, sender);
  for (const key of ['note', 'receiverPhone', 'analysis', 'history', 'owner', 'pendingTransfer']) assert.equal(key in view, false);
  assert.equal(allowed(c, { ...sender, id: 'different-sender' }), false);
  assert.throws(() => projectCase(c, { ...sender, id: 'different-sender' }));
});
test('hub and rider scopes cannot be broadened by body fields', () => {
  const w = seedWorkspace();
  assert.equal(allowed(w.cases[0], people[3]), false);
  assert.equal(allowed(w.cases[0], { ...people[1], id: 'different-rider' }), false);
  assert.throws(() => act(w, people[0], 'create', { parcelId: 'NEW', type: 'Delayed', hub: 'Chattogram GEC', lastHandler: 'Jashim' }));
  assert.throws(() => act(w, people[5], 'note', { id: w.cases[0].id, note: 'unauthorized' }));
  assert.throws(() => act(w, people[4], 'transfer', { id: w.cases[0].id, recipientId: people[2].id }));
});
test('a second transfer or resolution cannot bypass a pending acknowledgement', () => {
  const w = seedWorkspace(), c = w.cases[0];
  act(w, people[0], 'transfer', { id: c.id, recipientId: people[2].id });
  assert.throws(() => act(w, people[0], 'transfer', { id: c.id, recipientId: people[3].id }));
  assert.throws(() => act(w, people[0], 'resolve', { id: c.id, outcome: 'Delivered' }));
});
test('uncertain notes request review; rates account for volume changes', () => {
  assert.equal(summarizeNote('maybe tomorrow').manualReview, true);
  assert.equal(summarizeNote('maybe tomorrow').attempts, null);
  const f = forecast({ volume: 2000, exceptions: 100, previousVolume: 1000, previousExceptions: 100 });
  assert.equal(f.rate, 5); assert.equal(f.change, -50);
  assert.equal(forecast({ volume: 0 }).rate, null);
  assert.equal(forecast(seedWorkspace().routes[0]).risk, 'High risk');
});
test('only manager records route decisions; duplicates are rejected', () => {
  const w = seedWorkspace(), route = w.routes[0].route;
  assert.throws(() => act(w, people[0], 'precall', { route }));
  act(w, people[4], 'precall', { route });
  assert.equal(w.decisions.length, 1);
  assert.throws(() => act(w, people[4], 'precall', { route }));
});
