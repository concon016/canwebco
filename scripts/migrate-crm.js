require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

(async () => {
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS durum TEXT NOT NULL DEFAULT 'yeni'`;
  await sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS notlar TEXT`;
  console.log("Migration tamam.");
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' ORDER BY ordinal_position`;
  console.log(cols);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
