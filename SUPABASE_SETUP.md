# Jett Pal Supabase connection

The Supabase project is in the Europe region. The mobile app uses the public project URL and publishable key only.

## Configure the app build

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_SUPABASE_URL` to the Jett Pal project URL.
3. Set `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the project's `sb_publishable_...` key.
4. Do not commit `.env` to GitHub. It is intentionally not included in this repository.
5. Never use a Supabase secret key, service_role key, or database password in the mobile app.

The app's Supabase client is in `lib/supabase.js`. It persists user sessions with the AsyncStorage dependency already used by Jett Pal.

## Current status

- Database schema and initial organisation-level RLS policies are in `supabase/migrations/202611010001_initial_multi_company_schema.sql`.
- The app client is prepared, but sign-in, organisation onboarding and operational data synchronisation are not yet wired into the screens.
- Do not enable external customer accounts until authentication, membership invitations and cross-tenant access tests are complete.
