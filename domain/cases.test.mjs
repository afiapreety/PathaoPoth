import test from 'node:test';
import assert from 'node:assert/strict';
import { openCase, requestTransfer, acknowledgeTransfer, slaState, senderView, canReadCase, exceptionRate } from './cases.mjs';

const fixture = () => openCase({ parcel: { id: 'PP-2300', cod: 2300, senderId: 'sender-1', route: 'Mirpur → Chattogram', riderId: 'rider-1' }, type: 'Refused delivery', hub: 'Mirpur 10', lastHandler: 'Jashim', actor: { id: 'hub-1', name: 'Nabila' }, now: '2026-09-01T00:00:00Z' });

test('ownership stays continuous across both acknowledged handoffs', () => {
  const original = fixture();
  const pending = requestTransfer(original, 'hub-1', { id: 'care-1', name: 'Ayesha' });
  assert.equal(pending.owner.id, 'hub-1');
  assert.throws(() => acknowledgeTransfer(pending, 'stranger'));
  assert.throws(() => requestTransfer(pending, 'hub-1', { id: 'other', name: 'Other' }));
  const care = acknowledgeTransfer(pending, 'care-1');
  const destinationPending = requestTransfer(care, 'care-1', { id: 'destination-1', name: 'Rafi' });
  assert.equal(destinationPending.owner.id, 'care-1');
  const destination = acknowledgeTransfer(destinationPending, 'destination-1');
  assert.equal(destination.owner.id, 'destination-1');
  assert.equal(destination.history.length, 5);
  assert.equal(original.history.length, 1);
});

test('SLA thresholds and resolved age use fixed boundaries', () => {
  const record = fixture();
  assert.equal(slaState(record, Date.parse('2026-09-03T00:00:00Z')).state, 'At risk');
  assert.equal(slaState(record, Date.parse('2026-09-04T00:00:00Z')).state, 'Breached');
  assert.equal(slaState({ ...record, status: 'Resolved', resolvedAt: '2026-09-02T00:00:00Z' }).ageHours, 24);
});

test('sender response excludes every internal field and rejects another sender', () => {
  const record = { ...fixture(), receiverPhone: 'private', internalNotes: ['private'], publicUpdates: [{ at: 'today', message: 'Redelivery arranged', internalNote: 'private' }] };
  const view = senderView(record, 'sender-1');
  assert.deepEqual(Object.keys(view).sort(), ['parcelId', 'status', 'updates']);
  assert.equal(JSON.stringify(view).includes('private'), false);
  assert.throws(() => senderView(record, 'sender-2'));
});

test('scope checks and rates do not silently broaden access or invent denominators', () => {
  assert.equal(canReadCase(fixture(), { role: 'hub', hub: 'Moghbazar' }), false);
  assert.equal(canReadCase(fixture(), { role: 'rider', id: 'rider-1' }), true);
  assert.equal(canReadCase(fixture(), { role: 'unknown' }), false);
  assert.equal(exceptionRate(40, 1000), 4);
  assert.equal(exceptionRate(40, 0), null);
});
