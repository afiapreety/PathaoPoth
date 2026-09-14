import { randomUUID } from 'node:crypto';

export const people = [
  { id: 'hub-mirpur', name: 'Nabila Rahman', role: 'hub', hub: 'Mirpur 10', label: 'Mirpur hub' },
  { id: 'rider-jashim', name: 'Jashim Uddin', role: 'rider', hub: 'Mirpur 10', label: 'Rider' },
  { id: 'care-ayesha', name: 'Ayesha Khan', role: 'care', label: 'Customer care' },
  { id: 'hub-ctg', name: 'Rafi Ahmed', role: 'hub', hub: 'Chattogram GEC', label: 'Destination hub' },
  { id: 'ops-farhan', name: 'Farhan Islam', role: 'ops', label: 'Ops manager' },
  { id: 'sender-nova', name: 'Nova Fashion', role: 'sender', label: 'Sender' },
];
const iso = (hours = 0) => new Date(Date.now() - hours * 3600000).toISOString();
export const types = ['Refused delivery', 'Delayed', 'Damaged', 'Address missing', 'Sender dispute'];
export function seedWorkspace() {
  const cases = Array.from({ length: 16 }, (_, i) => {
    const hub = ['Mirpur 10', 'Chattogram GEC', 'Moghbazar'][i % 3];
    const owner = people[i % 3 === 0 ? 0 : i % 3 === 1 ? 3 : 2];
    return { id: `EX-${1042 + i}`, parcelId: `PP-${826401 + i}`, cod: i === 0 ? 2300 : 850 + i * 250,
      senderId: 'sender-nova', senderName: 'Nova Fashion', receiverPhone: '+880 1700 000000',
      type: types[i % types.length], hub, lastHandler: 'Jashim Uddin', riderId: 'rider-jashim',
      route: hub === 'Moghbazar' ? 'Moghbazar → Sylhet' : 'Mirpur → Chattogram', owner: { ...owner },
      openedAt: iso(i === 0 ? 27 : i * 6), status: i > 12 ? 'Resolved' : 'Open', resolvedAt: i > 12 ? iso(2) : null,
      pendingTransfer: null, note: i === 0 ? '3 bar gesi, customer phone off chilo. Guard dhukte dey nai. Duita kalo building, address clear na. Customer bole shondha 7tar por thakbe, COD 2300 ready korbe.' : '',
      analysis: null, nextStep: null, history: [{ kind: 'opened', at: iso(i === 0 ? 27 : i * 6), actor: owner.name, from: null, to: owner.name, message: 'Case opened; ownership accepted.' }],
      publicUpdates: [{ at: iso(i === 0 ? 27 : i * 6), message: 'Your delivery needs attention. Our team is reviewing it.', expectedResolution: new Date(Date.now() + 24 * 3600000).toISOString() }], attachments: [] };
  });
  return { demo: true, cases, decisions: [], events: [], routes: [
    { route: 'Mirpur → Chattogram', hub: 'Mirpur 10', rider: 'Jashim Uddin', previousVolume: 4200, previousExceptions: 100, volume: 4200, exceptions: 141, refused: 88, previousRefused: 62, weeklyRates: [1.9, 2.1, 2.38, 3.36], evidence: 'COD refusals account for 88 of 141 exceptions. Evening availability appears in 23 reviewed notes.' },
    { route: 'Moghbazar → Sylhet', hub: 'Moghbazar', rider: 'Hasan Ali', previousVolume: 2900, previousExceptions: 80, volume: 3100, exceptions: 67, refused: 22, previousRefused: 29, weeklyRates: [2.8, 2.7, 2.76, 2.16], evidence: 'Exception rate declined as parcel volume increased.' },
    { route: 'Chattogram → Dhaka', hub: 'Chattogram GEC', rider: 'Rafiq Ahmed', previousVolume: 3900, previousExceptions: 93, volume: 4100, exceptions: 109, refused: 35, previousRefused: 31, weeklyRates: [2.2, 2.4, 2.38, 2.66], evidence: 'A small increase; monitor before changing the route.' },
    { route: 'Mirpur → Rajshahi', hub: 'Mirpur 10', rider: 'Sabbir Hossain', previousVolume: 2600, previousExceptions: 71, volume: 2700, exceptions: 58, refused: 19, previousRefused: 25, weeklyRates: [2.9, 2.8, 2.73, 2.15], evidence: 'Pre-call coverage improved in the illustrative route data.' },
  ] };
}
export const emptyWorkspace = () => ({ demo: false, cases: [], parcels: [], routes: [], decisions: [], events: [] });
export function allowed(c, p) {
  return ['care', 'ops'].includes(p.role) || (p.role === 'hub' && (c.hub === p.hub || c.owner.id === p.id || c.pendingTransfer?.recipient.id === p.id)) || (p.role === 'rider' && c.riderId === p.id) || (p.role === 'sender' && c.senderId === p.id);
}
export function sla(c) {
  const hours = Math.max(0, (Date.parse(c.resolvedAt || new Date().toISOString()) - Date.parse(c.openedAt)) / 3600000);
  return { hours: Math.round(hours), state: c.status === 'Resolved' ? 'Resolved' : hours >= 72 ? 'Breached' : hours >= 48 ? 'At risk' : 'On track' };
}
export function projectCase(c, p) {
  if (!allowed(c, p)) throw new Error('Access denied');
  if (p.role === 'sender') return { id: c.id, parcelId: c.parcelId, status: c.status, publicUpdates: c.publicUpdates, senderName: c.senderName };
  return { ...c, sla: sla(c) };
}
export function forecast(r) {
  if (!r.volume || !r.previousVolume) return { rate: null, change: null, risk: 'Insufficient data', predictedRate: null, interval: null };
  const rate = r.exceptions / r.volume * 100, previous = r.previousExceptions / r.previousVolume * 100;
  const change = previous ? (rate / previous - 1) * 100 : null;
  const trend = (rate - previous) * 0.5;
  const predictedRate = Math.max(0, Math.min(100, rate + trend));
  const p = r.exceptions / r.volume, margin = 1.96 * Math.sqrt(p * (1 - p) / r.volume) * 100;
  return { rate, change, predictedRate, interval: [Math.max(0, predictedRate - margin * 1.5), Math.min(100, predictedRate + margin * 1.5)], risk: r.volume < 100 ? 'Insufficient data' : change > 20 && rate > 3 ? 'High risk' : change > 0 ? 'Watch' : 'Stable', method: 'Trend-based statistical estimate; not a calibrated probability of future failure.' };
}
export function summarizeNote(note) {
  const n = note.toLowerCase();
  const attempts = n.match(/(\d+)\s*(?:bar|times|attempt)/)?.[1];
  const evening = /shondha|evening|7tar|7 ?pm/.test(n), phone = /phone off|unreachable|switched off/.test(n), address = /address.*(?:clear na|missing)|duita|two.*building/.test(n);
  const confidence = evening && attempts && phone ? 0.86 : 0.42;
  return { attempts: attempts ? Number(attempts) : null, failureReason: phone ? 'Recipient unreachable during delivery attempts' : 'Not confidently established', addressQuality: address ? 'Ambiguous — confirm building and access' : 'Not established', availability: evening ? 'Evening, after 7 PM (from rider note)' : 'Unknown', recommendation: evening ? 'Arrange evening redelivery, 7–9 PM; call first and confirm building access.' : 'Contact the rider and recipient to clarify the incident.', confidence, manualReview: true, source: 'Rules-assisted extraction', evidence: note, limitation: 'No language model is configured. A care agent must review this extraction before confirming an action.' };
}
function event(c, p, kind, message, extra = {}) { c.history.push({ kind, at: iso(), actor: p.name, message, ...extra }); }
export function act(workspace, principal, action, body, staff = people) {
  const p = principal;
  if (p.role === 'sender') throw new Error('Senders have read-only access.');
  if (action === 'import-parcels') {
    if (p.role !== 'ops') throw new Error('Only operations managers can import manifests.');
    if (!Array.isArray(body.parcels) || !body.parcels.length || body.parcels.length > 100) throw new Error('Import 1–100 parcels at a time.');
    const parcels = body.parcels.map(parcel => {
      if (!['id', 'senderId', 'senderName', 'riderId', 'route'].every(k => typeof parcel[k] === 'string' && parcel[k].length > 0 && parcel[k].length <= 120) || !Number.isFinite(parcel.cod) || parcel.cod < 0) throw new Error('Each parcel needs id, senderId, senderName, riderId, route and a nonnegative COD amount.');
      return Object.fromEntries(['id', 'senderId', 'senderName', 'riderId', 'route', 'cod'].map(k => [k, parcel[k]]));
    });
    workspace.parcels ||= [];
    for (const parcel of parcels) {
      if (workspace.parcels.some(existing => existing.id === parcel.id)) throw new Error(`Parcel ${parcel.id} already exists; imports do not overwrite records.`);
      workspace.parcels.push(parcel);
    }
    return;
  }
  if (action === 'import-routes') {
    if (p.role !== 'ops') throw new Error('Only operations managers can import route measurements.');
    if (!Array.isArray(body.routes) || body.routes.length > 100 || !body.routes.length) throw new Error('Import 1–100 route measurements.');
    workspace.routes = body.routes.map(r => {
      if (!['route', 'hub', 'rider', 'evidence'].every(k => typeof r[k] === 'string' && r[k].length > 0 && r[k].length <= 2000) || !['volume', 'exceptions', 'previousVolume', 'previousExceptions'].every(k => Number.isInteger(r[k]) && r[k] >= 0) || r.exceptions > r.volume || r.previousExceptions > r.previousVolume) throw new Error('Measurements need route, hub, rider, evidence, and valid current/previous volumes and exception counts.');
      return Object.fromEntries(['route', 'hub', 'rider', 'evidence', 'volume', 'exceptions', 'previousVolume', 'previousExceptions'].map(k => [k, r[k]]));
    }); return;
  }
  if (action === 'create') {
    if (!['hub', 'care'].includes(p.role)) throw new Error('Only hub staff and care can open cases.');
    if (!body.parcelId?.trim() || !types.includes(body.type) || !body.hub || !body.lastHandler?.trim()) throw new Error('Complete all four fields.');
    if (p.role === 'hub' && body.hub !== p.hub) throw new Error('Choose your own hub.');
    if (workspace.cases.some(c => c.parcelId === body.parcelId && c.status !== 'Resolved')) throw new Error('This parcel already has an open case.');
    const parcel = body.parcelId === 'PP-826500' && workspace.demo ? { cod: 2300, senderId: 'sender-nova', senderName: 'Nova Fashion', riderId: 'rider-jashim', route: 'Mirpur → Chattogram' } : workspace.parcels?.find(parcel => parcel.id === body.parcelId);
    if (!parcel) throw new Error('Parcel not found. Ask operations to import its manifest first.');
    const c = { id: `EX-${randomUUID().slice(0, 8).toUpperCase()}`, parcelId: body.parcelId.trim().slice(0, 100), type: body.type, hub: body.hub, lastHandler: body.lastHandler.trim().slice(0, 100), ...parcel, owner: { ...p }, status: 'Open', openedAt: iso(), resolvedAt: null, pendingTransfer: null, note: '', analysis: null, nextStep: null, history: [], publicUpdates: [{ at: iso(), message: 'Our delivery team is reviewing your parcel.' }], attachments: [] };
    c.id = `EX-${randomUUID().slice(0, 8).toUpperCase()}`;
    event(c, p, 'opened', 'Case opened; ownership accepted.'); workspace.cases.unshift(c); return c;
  }
  if (action === 'precall') {
    if (p.role !== 'ops') throw new Error('Only operations managers can record route decisions.');
    if (!workspace.routes.some(r => r.route === body.route)) throw new Error('Unknown route.');
    if (workspace.decisions.some(d => d.route === body.route && d.status === 'Planned')) throw new Error('A pre-call plan already exists for this route.');
    workspace.decisions.push({ id: randomUUID(), route: body.route, at: iso(), owner: p.name, status: 'Planned', action: 'Pre-call COD recipients; confirm cash readiness, address, and evening availability.' }); return;
  }
  const c = workspace.cases.find(c => c.id === body.id);
  if (!c || !allowed(c, p)) throw new Error('Case not available in your scope.');
  if (c.status === 'Resolved') throw new Error('This case is already resolved.');
  if (action === 'transfer') {
    if (c.owner.id !== p.id) throw new Error('Only the current owner can request a handoff.');
    if (c.pendingTransfer) throw new Error('A handoff is already awaiting acknowledgement.');
    const recipient = staff.find(person => person.id === body.recipientId && ['hub', 'care'].includes(person.role));
    if (!recipient || recipient.id === p.id) throw new Error('Choose a different receiving staff member.');
    c.pendingTransfer = { recipient: { ...recipient }, at: iso(), from: c.owner.name };
    event(c, p, 'transfer-requested', 'Handoff requested. Current owner remains accountable.', { from: p.name, to: recipient.name });
  } else if (action === 'acknowledge') {
    if (c.pendingTransfer?.recipient.id !== p.id) throw new Error('Only the receiving person can acknowledge.');
    event(c, p, 'transfer-acknowledged', 'Handoff acknowledged. Ownership accepted.', { from: c.owner.name, to: p.name });
    c.owner = { ...p }; if (p.hub) c.hub = p.hub; c.pendingTransfer = null;
  } else if (action === 'note') {
    if (!['rider', 'hub', 'care'].includes(p.role)) throw new Error('Your role cannot add rider notes.');
    if (!body.note?.trim() || body.note.length > 10000) throw new Error('Enter a note of 1–10,000 characters.');
    c.note = body.note.trim(); c.analysis = null; event(c, p, 'note', 'Internal rider note updated.');
  } else if (action === 'analyze') {
    if (!['care', 'hub'].includes(p.role)) throw new Error('Only hub staff and care may analyze notes.');
    if (!c.note) throw new Error('Add a rider note first.');
    c.analysis = summarizeNote(c.note); event(c, p, 'analysis', 'Rider note structured for manual review.');
  } else if (action === 'confirm') {
    if (p.role !== 'care' || !c.analysis) throw new Error('Care must review an analysis first.');
    if (typeof body.nextStep !== 'string' || body.nextStep.trim().length < 8 || body.nextStep.length > 1000) throw new Error('Enter a concrete next step.');
    if (!body.reviewed) throw new Error('Confirm that you reviewed the evidence.');
    c.nextStep = body.nextStep.trim(); c.status = 'Action confirmed'; event(c, p, 'confirmed', c.nextStep);
    c.publicUpdates.push({ at: iso(), message: 'Our care team has confirmed the next delivery action and is coordinating with the hub.', expectedResolution: new Date(Date.now() + 24 * 3600000).toISOString() });
  } else if (action === 'resolve') {
    if (c.owner.id !== p.id || c.pendingTransfer) throw new Error('Only the owner can resolve, after pending handoffs are acknowledged.');
    if (!body.outcome || !['Delivered', 'Returned to sender', 'Claim settled'].includes(body.outcome)) throw new Error('Choose a resolution outcome.');
    c.status = 'Resolved'; c.resolvedAt = iso(); event(c, p, 'resolved', body.outcome);
    c.publicUpdates.push({ at: iso(), message: `Your case has been resolved: ${body.outcome.toLowerCase()}.` });
  } else throw new Error('Unknown action.');
  return c;
}
