import { eq } from "drizzle-orm";
import { db } from "../src/client";
import { user } from "../src/schema";

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address as an argument.");
    process.exit(1);
}

async function main() {
    const [existingUser] = await db
        .select()
        .from(user)
        .where(eq(user.email, email));

    if (!existingUser) {
        console.error(`User with email ${email} not found.`);
        process.exit(1);
    }

    await db
        .update(user)
        .set({ role: "admin" })
        .where(eq(user.email, email));

    console.log(`User ${email} has been promoted to admin.`);
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
