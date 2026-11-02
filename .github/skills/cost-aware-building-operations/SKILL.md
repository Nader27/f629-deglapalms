---
name: cost-aware-building-operations
description: 'Optimize Angular 22 and Supabase usage in this building-management app. Use for slow screens, duplicate requests, broad selects, repeated reloads, bundle-size concerns, cloud-cost reviews, and performance changes that must preserve RLS and resident/admin behavior.'
argument-hint: 'Describe the workflow or resource usage you want optimized.'
user-invocable: true
---
# Cost-Aware Building Operations

## When to Use
- A resident or admin screen makes too many Supabase requests.
- A query returns more data than the UI needs.
- A mutation reloads an entire collection unnecessarily.
- Angular build, hydration, or lazy-loading behavior regresses.
- A proposed cache, realtime listener, polling loop, schema change, or dependency may affect cost.

## Project Baseline
- Run commands through the existing npm scripts: `npm test -- --watch=false` and `npm run build`.
- Inspect `src/app/services/supabase.service.ts`, `src/app/services/finance.service.ts`, the owning page/component, and `init.sql` before changing data access.
- Public reads and authenticated admin writes are enforced by Supabase RLS. Client route guards are not a replacement for RLS.
- Relevant tables are `apartments`, `resident_info_approvals`, `transactions`, `app_settings`, and `gate_cards`; receipt files live in the `receipts` storage bucket.

## Procedure
1. Map the workflow from route to component to service method and note every request and full-collection reload.
2. State one falsifiable hypothesis about the cost, such as duplicate initialization, `select('*')` payload, client-side filtering, N+1 reads, or a mutation followed by an avoidable reload.
3. Check the nearest test or add a focused test when the behavior is not covered.
4. Prefer, in order: remove duplicate calls; select explicit columns; push filtering/order into Supabase; update local signals from mutation responses; preserve lazy route boundaries; then consider caching only with explicit invalidation.
5. For schema or RLS edits, verify both public resident behavior and authenticated admin behavior. Do not loosen a policy to make a test pass.
6. Validate the smallest slice first, then run `npm test -- --watch=false` for behavior or `npm run build` for compile/SSR and bundle changes.
7. Report what was measured versus inferred. Avoid claiming cloud savings without request counts, payload sizes, build output, or Supabase usage data.

## Guardrails
- Do not use service-role credentials in browser code.
- Do not add unbounded realtime subscriptions or polling.
- Do not replace a mutation response with a stale optimistic value when the server applies defaults or generated fields.
- Do not change apartment layout generation or finance totals as an incidental optimization.
- Keep error handling and loading states intact.
