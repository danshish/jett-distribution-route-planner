# Jett Pal — Commercial Product Roadmap

## Product direction
Jett Pal is the first commercial software product developed by MAGIX. Jett Distribution is the first real-world pilot customer. The product must support multiple independent customer companies without exposing one company's data to another.

## Current application baseline
The current Expo / React Native app stores routes, cached addresses, drivers, stock counts and other operational state locally with AsyncStorage. It has no user authentication, central organisation database, server-side tenant isolation, subscription billing or cross-device synchronisation. Local storage is suitable for the current single-device prototype, but it is not a secure multi-company production architecture.

Existing capabilities include:
- UK address search and address caching
- Multi-stop route planning and navigation hand-off
- Delivery outcomes and quantity recording
- Wheelie-bin and food-caddy stock tracking
- Driver records and active-driver selection
- Vehicle checks, mileage/fuel logs and defect reports
- Excel/CSV and Google Sheets imports
- Offline map import and offline cached address search

## Commercial product principles
1. **Tenant isolation:** every operational record belongs to an organisation. The server must enforce organisation-level access; hiding records in the app is not security.
2. **User identity:** users sign in individually and belong to one or more organisations.
3. **Role-based access:** initial roles are Owner/Admin, Manager/Supervisor, Driver and Operative. A person may perform both driver and operative duties on a job.
4. **Offline-first operations:** retain local working capability and add safe synchronisation when connectivity returns. Resolve conflicts explicitly; never silently overwrite completed delivery records.
5. **Company configuration:** each organisation has its own users, vehicles, drivers, routes, stock, branding and settings.
6. **Subscription readiness:** plans and feature entitlements must be checked server-side. Do not rely on a locally stored plan flag.
7. **Privacy and auditability:** record who created or changed important operational records and when. Minimise personal data and provide appropriate retention/export controls.

## Proposed delivery phases

### Phase 1 — Pilot hardening
- Complete and test navigation and spreadsheet imports.
- Test delivery reporting, driver management, vehicle checks and offline behaviour.
- Fix data-loss and duplicate-submission risks.
- Add clear app version/build identification and a repeatable release checklist.

### Phase 2 — Multi-company foundation
- Create a Supabase project for the Jett Pal backend.
- Use Supabase Auth for individual user accounts and Postgres for structured operational data.
- Use Row Level Security (RLS) policies to enforce organisation membership and role-based access on every tenant-owned table.
- Create organisations, memberships, user profiles and roles.
- Move shared operational records to organisation-scoped server storage.
- Test cross-company access denial at the database/API layer.
- Add sign-in and invitation/onboarding flows.
- Preserve local offline queues and implement deliberate synchronisation with conflict handling.

### Phase 3 — Commercial operations
- Add company setup, team invitations and admin tools.
- Add subscription plans, billing integration, entitlement checks and account status handling.
- Add usage limits and plan management.
- Add audit logs, data export and support diagnostics.

### Phase 4 — Pilot and launch
- Run Jett Distribution as the first pilot organisation.
- Test with realistic driver/operative workflows and multiple devices.
- Resolve pilot feedback before onboarding external companies.
- Prepare privacy information, terms, support process and store release assets.

## Backend decision
**Recommended: Supabase.** It fits the existing Expo app and provides Postgres, authentication and database-enforced Row Level Security. Relational data suits organisations, memberships, drivers, vehicles, routes, deliveries and stock records. Expo's current guide documents Supabase setup for React Native. Firestore has convenient built-in offline persistence, but its documented conflict behaviour is last-write-wins; Jett Pal should keep explicit control over delivery-report conflicts rather than silently overwrite operational records.

References:
- Expo Supabase guide: https://docs.expo.dev/guides/using-supabase/
- Supabase Expo quickstart: https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native
- Firestore offline behaviour: https://firebase.google.com/docs/firestore/manage-data/enable-offline

## Initial pricing hypotheses
These are test prices, not final commitments:
- Starter: £29.99/month
- Professional: £59.99/month
- Business: £99.99/month
- Enterprise: quoted

Pricing should ultimately be based on customer value and a clear unit such as active vehicles, users or operational sites. Avoid charging for features before they are reliable.

## Immediate next step
Create a Supabase account and a new project for Jett Pal. Keep database credentials private. The mobile app will eventually use only the project URL and publishable key; never put a service-role key in the app or commit secrets to GitHub. After the project is created, configure the schema and RLS policies before connecting operational screens.

## Release gate
Do not describe Jett Pal as multi-company ready until automated or repeatable tests prove that a user from Company A cannot read, change, export or infer Company B's records through any API or client workflow.
