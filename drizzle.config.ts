import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite", // D1 এর জন্য 'sqlite' ব্যবহার করতে হয়
  dbCredentials: {
    wranglerConfigPath: "./wrangler.jsonc", // আপনার JSONC কনফিগারেশন পাথ
    dbName: "flytripvisa_db",
  },
});
