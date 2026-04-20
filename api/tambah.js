import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI);

export default async function handler(req, res) {
  if (req.method === "POST") {
    await client.connect();
    const db = client.db("kasir");

    const data = req.body;

    await db.collection("transaksi").insertOne({
      nama: data.nama,
      total: data.total,
      created_at: new Date()
    });

    res.status(200).json({ success: true });
  }
}
