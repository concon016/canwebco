-- mcdnetwork contact form messages
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  ad_soyad TEXT NOT NULL,
  eposta TEXT NOT NULL,
  konu TEXT,
  mesaj TEXT NOT NULL,
  replied BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- mini-CRM alanları (2026-07-17): müşteri talebinin aşaması + serbest not
  durum TEXT NOT NULL DEFAULT 'yeni', -- yeni | teklif_gonderildi | gorusuluyor | anlasildi | reddedildi
  notlar TEXT
);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);
