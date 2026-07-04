---
name: Postgres to MongoDB migration pattern
description: Checklist of things that break when swapping a Drizzle/Postgres storage layer for Mongoose/MongoDB in a fullstack-js app.
---

When migrating an existing Drizzle+Postgres app to Mongoose+MongoDB, IDs change from serial integers to ObjectId strings. This has ripple effects beyond the storage layer.

**Why:** Postgres schemas typically use `serial` int primary keys; Mongo documents use `_id: ObjectId`. Treating them as interchangeable causes silent type errors or runtime 404s.

**How to apply:** When doing this migration, check/update all of these:
- `shared/schema.ts` — replace `pgTable`/`drizzle-zod` schemas with plain Zod schemas; change all `id`/`*Id` fields from `number` to `string`.
- Any `parseInt(req.params.id)` in Express routes — must become plain `req.params.id` (string), since Mongo `findById` accepts strings directly.
- Frontend mutation/query functions typed with `id: number` (e.g. delete mutations) — change to `string`.
- Give Mongoose schemas a `toJSON` transform that renames `_id` → `id` and strips `__v`, so the API response shape matches what the frontend already expects (keeps this a drop-in swap for existing UI code).
- Leave any *unrelated*, unused legacy modules (e.g. an unused chat/Postgres integration) alone if nothing imports them — no need to migrate dead code just because the main schema file changed, as long as it still type-checks/doesn't get imported at runtime.
- Wrap the Mongo connection call so it throws a clear, catchable error (not a hard crash) when the connection string secret is missing, since the DB secret is often provided after the code is written.
