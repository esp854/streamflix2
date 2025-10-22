-- Export de la base de données StreamFlix
-- Ce script exporte toutes les tables dans des fichiers CSV

-- Export users
COPY users TO '/tmp/users.csv' WITH CSV HEADER;

-- Export favorites
COPY favorites TO '/tmp/favorites.csv' WITH CSV HEADER;

-- Export user_preferences
COPY user_preferences TO '/tmp/user_preferences.csv' WITH CSV HEADER;

-- Export contact_messages
COPY contact_messages TO '/tmp/contact_messages.csv' WITH CSV HEADER;

-- Export subscriptions
COPY subscriptions TO '/tmp/subscriptions.csv' WITH CSV HEADER;

-- Export payments
COPY payments TO '/tmp/payments.csv' WITH CSV HEADER;

-- Export banners
COPY banners TO '/tmp/banners.csv' WITH CSV HEADER;

-- Export collections
COPY collections TO '/tmp/collections.csv' WITH CSV HEADER;

-- Export content
COPY content TO '/tmp/content.csv' WITH CSV HEADER;

-- Export episodes
COPY episodes TO '/tmp/episodes.csv' WITH CSV HEADER;

-- Export notifications
COPY notifications TO '/tmp/notifications.csv' WITH CSV HEADER;

-- Export user_sessions
COPY user_sessions TO '/tmp/user_sessions.csv' WITH CSV HEADER;

-- Export view_tracking
COPY view_tracking TO '/tmp/view_tracking.csv' WITH CSV HEADER;

-- Export comments
COPY comments TO '/tmp/comments.csv' WITH CSV HEADER;