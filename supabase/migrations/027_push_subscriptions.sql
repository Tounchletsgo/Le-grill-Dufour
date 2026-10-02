-- Push notification subscriptions for drivers
CREATE TABLE IF NOT EXISTS driver_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_push_endpoint ON driver_push_subscriptions(endpoint);
CREATE INDEX IF NOT EXISTS idx_driver_push_driver ON driver_push_subscriptions(driver_id);

ALTER TABLE driver_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on driver_push_subscriptions"
  ON driver_push_subscriptions FOR ALL
  USING (true) WITH CHECK (true);
