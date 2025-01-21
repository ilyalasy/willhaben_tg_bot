CREATE TABLE listings (
  listingId TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  liked INTEGER, -- NULL for neutral, 1 for liked, 0 for disliked,
  translatedDescription TEXT,
  firstSeenAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  messageIds TEXT
);

-- CREATE TABLE telegram_messages (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   listing_id TEXT NOT NULL,
--   message_id INTEGER NOT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   FOREIGN KEY (listing_id) REFERENCES listings(listingId)
-- );