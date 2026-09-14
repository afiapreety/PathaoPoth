# PathaoPoth — Delivery Exception Resolution Desk

Source: `06-PathaoPoth.pdf`, supplied by the project owner.

## Acceptance criteria

- Staff can open an exception using four fields: parcel identifier, exception type, hub/location, and last handler. Parcel metadata supplies COD and sender details.
- Each open case has exactly one named owner. A requested handoff leaves the current owner accountable until the recipient acknowledges it. Every request and acknowledgement is recorded in the ownership timeline.
- Hub staff access their hub's cases, riders their assignments, care cross-team cases, and operations managers aggregate operational detail. Authorization must be enforced by the data service, not just hidden navigation.
- Senders access only their parcels' sanitized timelines. Internal notes, blame, and receiver contact details are excluded from sender responses.
- Rider notes accept rough Banglish. Analysis extracts attempts, failure reason, address quality, availability, a recommended action, confidence, and supporting evidence. Care confirms recommendations. Uncertain analysis requires manual review.
- SLA thresholds flag aging cases automatically, including the 72-hour breach. Resolved cases stop aging.
- Operations analytics compare exception rates using parcel-volume denominators by hub, route, and rider, with week-over-week comparisons.
- Route risk predictions show recent evidence and uncertainty, and support an actionable pre-call decision. Demo or heuristic output must be labeled honestly.
- Demonstrate a refused delivery with COD ৳2,300, an evening redelivery recommendation, acknowledged Mirpur → care → destination-hub transfers, and the manager's route pre-call decision.
- Provide an activated demo account for `demouser140826@yopmail.com` and register matching local HTTPS login callback URIs.

## Delivery verification

Verify persistence, scoped reads, sender redaction, acknowledgement ownership invariants, SLA calculations, note-review behavior, route-rate denominators, and a real hosted login. Record any platform or authentication blockers explicitly.
