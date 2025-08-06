import { db } from "./index";
import { users } from "./schema";

async function main() {
  await db.insert(users).values({
    id: "123",
    name: "Kjetilmann",
    image: "https://example.com/avatar.png",
  });

  const allUsers = await db.select().from(users);
  console.log(allUsers);
}

main().catch(console.error);
