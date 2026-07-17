const nodemailer = require("nodemailer");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

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
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res.status(405).json({ error: "Desteklenmeyen method." });
    }
    if (!requireAdmin(req, res)) return;

    const { messageId, to, subject, body } = req.body || {};
    if (!to || !subject || !body) {
      return res.status(400).json({ error: "to, subject ve body zorunlu." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"canwebco" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      text: body,
      replyTo: process.env.GMAIL_USER,
    });

    if (messageId) {
      await sql`UPDATE messages SET replied = TRUE WHERE id = ${messageId}`;
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "E-posta gönderilemedi: " + err.message });
  }
};
