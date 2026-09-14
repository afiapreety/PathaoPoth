export const EXCEPTION_TYPES = ['Refused delivery', 'Delayed', 'Damaged', 'Address missing', 'Sender dispute'];

export function openCase({ parcel, type, hub, lastHandler, actor, now = new Date().toISOString() }) {
  if (!parcel?.id || !EXCEPTION_TYPES.includes(type) || !hub || !lastHandler || !actor?.id || !actor?.name) {
    throw new Error('Parcel, exception type, hub, last handler and a named owner are required.');
  }
  return {
    id: crypto.randomUUID(), parcelId: parcel.id, cod: parcel.cod,
    senderId: parcel.senderId, route: parcel.route, riderId: parcel.riderId,
    type, hub, lastHandler, owner: { ...actor }, status: 'Open', openedAt: now,
    pendingTransfer: null, internalNotes: [], publicUpdates: [],
    history: [{ kind: 'opened', at: now, actorId: actor.id, owner: { ...actor } }],
  };
}

export function requestTransfer(record, actorId, recipient, now = new Date().toISOString()) {
  if (record.status === 'Resolved') throw new Error('Resolved cases cannot be transferred.');
  if (record.owner.id !== actorId) throw new Error('Only the accountable owner can request a transfer.');
  if (record.pendingTransfer) throw new Error('A transfer is already awaiting acknowledgement.');
  if (!recipient?.id || !recipient?.name || recipient.id === actorId) throw new Error('Choose a different named recipient.');
  return {
    ...record,
    pendingTransfer: { recipient: { ...recipient }, requestedAt: now, requestedBy: actorId },
    history: [...record.history, { kind: 'transfer-requested', at: now, actorId, from: { ...record.owner }, to: { ...recipient } }],
  };
}

export function acknowledgeTransfer(record, actorId, now = new Date().toISOString()) {
  const transfer = record.pendingTransfer;
  if (!transfer || transfer.recipient.id !== actorId) throw new Error('Only the requested recipient can acknowledge.');
  return {
    ...record, owner: { ...transfer.recipient }, pendingTransfer: null,
    history: [...record.history, { kind: 'transfer-acknowledged', at: now, actorId, from: { ...record.owner }, to: { ...transfer.recipient } }],
  };
}

export function slaState(record, now = Date.now()) {
  const end = record.resolvedAt ? Date.parse(record.resolvedAt) : now;
  const ageHours = Math.max(0, (end - Date.parse(record.openedAt)) / 3600000);
  return { ageHours, state: record.status === 'Resolved' ? 'Resolved' : ageHours >= 72 ? 'Breached' : ageHours >= 48 ? 'At risk' : 'On track' };
}

// Apply this projection on the trusted server before returning data to a sender.
export function senderView(record, senderId) {
  if (record.senderId !== senderId) throw new Error('Parcel is not owned by this sender.');
  return {
    parcelId: record.parcelId, status: record.status,
    updates: record.publicUpdates.map(({ at, message, expectedResolution }) => ({ at, message, expectedResolution })),
  };
}

export function canReadCase(record, principal) {
  if (principal.role === 'care' || principal.role === 'ops') return true;
  if (principal.role === 'hub') return record.hub === principal.hub;
  if (principal.role === 'rider') return record.riderId === principal.id;
  if (principal.role === 'sender') return record.senderId === principal.id;
  return false;
}

export function exceptionRate(exceptions, parcelVolume) {
  if (!Number.isFinite(parcelVolume) || parcelVolume <= 0) return null;
  return exceptions / parcelVolume * 100;
}
