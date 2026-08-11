# Environment Variables Setup

Copy these into your Netlify dashboard (Site Settings > Environment Variables)
and into your local `.env.local` file for development.

## Required Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Where to find them

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
5. Copy the **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Copy the **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

## Notes

- `NEXT_PUBLIC_` prefixed vars are exposed to the browser (safe for anon key)
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never expose in client code
- For local dev, create `.env.local` in the project root with the same values
