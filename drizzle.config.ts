import { config } from "dotenv";
config({ path: ".env.local" }); // 👈 this is the key

const drizzleConfig = {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  dialect: "postgresql",
};

export default drizzleConfig;
