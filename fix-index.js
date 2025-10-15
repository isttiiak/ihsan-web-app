// Run this script once to drop the problematic unique index on zikrTypes.name
// Usage: node fix-index.js

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const db = mongoose.connection.db;
    const collection = db.collection("users");

    // List all indexes
    const indexes = await collection.indexes();
    console.log("\nCurrent indexes:", JSON.stringify(indexes, null, 2));

    // Drop the problematic index if it exists
    const badIndexName = "zikrTypes.name_1";
    const hasIndex = indexes.some((idx) => idx.name === badIndexName);

    if (hasIndex) {
      await collection.dropIndex(badIndexName);
      console.log(`\n✅ Dropped index: ${badIndexName}`);
    } else {
      console.log(`\n✓ Index ${badIndexName} does not exist (already fixed)`);
    }

    console.log(
      "\nRemaining indexes:",
      JSON.stringify(await collection.indexes(), null, 2)
    );

    await mongoose.disconnect();
    console.log("\nDone!");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

fixIndex();
