const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

function toClient(row) {
  return {
    id: row.id,
    adSoyad: row.ad_soyad,
    eposta: row.eposta,
    konu: row.konu,
    mesaj: row.mesaj,
    replied: row.replied,
    createdAt: row.created_at,
    durum: row.durum,
    notlar: row.notlar,
  };
}

const VALID_DURUM = ["yeni", "teklif_gonderildi", "gorusuluyor", "anlasildi", "reddedildi"];

function requireAdmin(req, res) {
  const key = req.headers["x-admin-key"];
  if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
    res.status(401).json({ error: "Yetkisiz. Admin şifresi hatalı." });
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  try {
    if (req.method === "POST") {
      const b = req.body || {};
      if (!b.adSoyad || !b.eposta || !b.mesaj) {
        return res.status(400).json({ error: "Ad, e-posta ve mesaj zorunlu." });
      }
      await sql`
        INSERT INTO messages (ad_soyad, eposta, konu, mesaj)
        VALUES (${b.adSoyad}, ${b.eposta}, ${b.konu ?? null}, ${b.mesaj})
      `;
      return res.status(201).json({ ok: true });
    }

    if (req.method === "GET") {
      if (!requireAdmin(req, res)) return;
      const rows = await sql`SELECT * FROM messages ORDER BY created_at DESC`;
      return res.status(200).json(rows.map(toClient));
    }

    if (req.method === "PATCH") {
      if (!requireAdmin(req, res)) return;
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id gerekli." });
      const b = req.body || {};

      if (b.durum !== undefined && !VALID_DURUM.includes(b.durum)) {
        return res.status(400).json({ error: "Geçersiz durum değeri." });
      }

      let rows;
      if (b.replied !== undefined) {
        rows = await sql`UPDATE messages SET replied = ${!!b.replied} WHERE id = ${id} RETURNING *`;
      } else if (b.durum !== undefined) {
        rows = await sql`UPDATE messages SET durum = ${b.durum} WHERE id = ${id} RETURNING *`;
      } else if (b.notlar !== undefined) {
        rows = await sql`UPDATE messages SET notlar = ${b.notlar} WHERE id = ${id} RETURNING *`;
      } else {
        return res.status(400).json({ error: "Güncellenecek bir alan belirtilmedi." });
      }

      if (rows.length === 0) return res.status(404).json({ error: "Mesaj bulunamadı." });
      return res.status(200).json(toClient(rows[0]));
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req, res)) return;
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id gerekli." });
      const rows = await sql`DELETE FROM messages WHERE id = ${id} RETURNING id`;
      if (rows.length === 0) return res.status(404).json({ error: "Mesaj bulunamadı." });
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return res.status(405).json({ error: "Desteklenmeyen method." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Sunucu hatası." });
  }
};
