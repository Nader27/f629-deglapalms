---
name: "Building Operations Cost-Aware Development"
description: "Use when changing Angular pages, services, Supabase queries, schema, auth, finance, resident workflows, or building-management UI in this project."
applyTo: ["src/**/*.ts", "src/**/*.css", "init.sql", "scripts/**/*.mjs"]
---
# Building Operations Rules

- Treat this as an Angular 22 standalone SSR app. Preserve lazy-loaded routes, signals, hydration, and existing service boundaries unless the task requires otherwise.
- Read the nearest model, service, route, guard, and component before editing. Keep changes local and avoid introducing a new state-management or UI framework.
- Keep Supabase access deliberate: select only required columns, filter and order in the query, avoid repeated reloads after mutations, and do not add polling or subscriptions without a clear freshness requirement.
- Preserve the public-resident versus authenticated-admin boundary defined by `init.sql`. Never weaken RLS, expose secrets, or trust client-side admin checks as authorization.
- Prefer optimistic local signal updates only when rollback/error handling is clear. Otherwise update local state from the mutation response instead of issuing a second full-table fetch.
- For finance, use numeric conversion consistently and preserve the transaction types, receipt behavior, and computed totals. Do not silently change money semantics.
- Keep apartment layout generation and persisted apartment fields separate. Do not persist derived side/position data unless the schema and all consumers are updated together.
- Validate the smallest relevant slice first: `npm test -- --watch=false` for behavior, `npm run build` for compilation/SSR, and a focused review of query columns and RLS for data changes.
- Do not add dependencies, broad refactors, or verbose comments for a narrow fix. Record unresolved database, environment, or manual-browser assumptions in the final response.
