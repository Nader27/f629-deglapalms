import { writeFileSync } from 'node:fs';

// Populates src/environments/environment.ts from SUPABASE_URL / SUPABASE_KEY at build time
// (set these as Environment Variables in your Vercel/Netlify project settings).
const supabaseUrl = process.env['SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_KEY'];

if (!supabaseUrl || !supabaseKey) {
    console.warn('[set-env] SUPABASE_URL / SUPABASE_KEY not set — keeping existing src/environments/environment.ts.');
    process.exit(0);
}

const content = `export const environment = {
  production: true,
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
};
`;

writeFileSync('src/environments/environment.ts', content);
console.log('[set-env] src/environments/environment.ts generated from SUPABASE_URL / SUPABASE_KEY.');
