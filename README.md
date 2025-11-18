# Echo Suite Portal

This repository contains the source code for **Echo Suite Portal**, a Next.js application backed by Supabase.  
The portal acts as the user dashboard for **Echo Suite**, the automation‑first productivity assistant created by Orrya.  

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment variables**

   Copy the `.env.local.example` file to `.env.local` and replace the placeholders with the credentials from your Supabase project, your service role key and the base URL of your n8n instance:

   ```bash
   cp .env.local.example .env.local
   # edit .env.local in your favourite editor
   ```

3. **Apply database migrations**

   The SQL file in `supabase/migrations` defines the tables and policies used by the portal.  
   Apply it via the Supabase SQL editor or the Supabase CLI:

   ```sql
   -- Example using the Supabase dashboard
   -- Paste the contents of supabase/migrations/20231118_create_tables.sql into the SQL editor and run it.
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

   The portal will be available at `http://localhost:3000`.

## Project structure

- `app/` – Next.js **app router** pages and layouts.  
  Pages are organised by feature (dashboard, email viewer, summary archive, settings, auth).  
- `components/` – Reusable React components such as the navigation bar and list/card components.
- `lib/` – Helper modules, including the Supabase client.
- `supabase/migrations/` – SQL migrations defining tables and row level security policies.
- `tailwind.config.ts` – Tailwind CSS configuration customised with Echo Suite’s colour palette and fonts.

## Authentication

Authentication is handled by Supabase Auth.  
Users can sign in via Microsoft OAuth (using Azure as the provider) or with an email and password.  
The OAuth callback is handled in a dedicated page (`app/auth/callback/page.tsx`) which exchanges the temporary code for a session and then redirects the user back to the app.

## Automation via n8n

Several actions in the portal (generating reply drafts, marking emails as resolved, etc.) trigger **n8n** workflows.  
The API endpoint defined in `app/api/n8n/[action]/route.ts` forwards requests to user‑specific n8n webhooks.  
You can customise the webhook IDs per user or supply them via the request body.

## Styling

The application uses **Tailwind CSS** with a custom theme that reflects Orrya’s branding:

- Graphite base: `#2A2A2A`
- UV Purple: `#B968FF`
- Magenta accent: `#FF4FC9`

Shadows and a subtle glassmorphism effect are applied to panels and cards to give the UI a calm, modern feel.

## Note

This codebase is designed to be extensible.  
For a production deployment you should further refine error handling, session management and API security.  
The generated code is a solid foundation for building the Echo Suite portal locally.