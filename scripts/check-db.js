const { Client } = require('pg');
require('dotenv').config();

const URLS = [
  process.env.DATABASE_URL,
  'postgresql://postgres:postgres@127.0.0.1:5432/mybusiness',
  'postgresql://postgres:postgres@localhost:5432/mybusiness',
];

async function check(url) {
  const client = new Client({ connectionString: url });
  await client.connect();
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
  );
  const version = await client.query('SELECT version()');
  console.log('\n---', url);
  console.log('Server:', version.rows[0].version.slice(0, 60));
  console.log('Tables:', tables.rows.map((r) => r.tablename));
  await client.end();
}

async function main() {
  const unique = [...new Set(URLS.filter(Boolean))];
  for (const url of unique) {
    try {
      await check(url);
    } catch (e) {
      console.log('\n---', url);
      console.log('ERROR:', e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
