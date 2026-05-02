
import { MongoClient, ObjectId } from 'mongodb';

async function run() {
  const uri = "mongodb+srv://obafemilared_db_user:YgnYI4sogNQXfkTw@cluster0.lvgzohs.mongodb.net/faith-care";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("faith-care");
    const orgCount = await db.collection("organizations").countDocuments();
    console.log("Organization Count:", orgCount);
    const userCount = await db.collection("users").countDocuments();
    console.log("User Count:", userCount);
    if (orgCount > 0) {
      const orgs = await db.collection("organizations").find({}).limit(5).toArray();
      console.log("Sample Organizations:", JSON.stringify(orgs, null, 2));
    }
  } finally {
    await client.close();
  }
}

run().catch(console.error);
