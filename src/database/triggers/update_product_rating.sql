CREATE OR REPLACE FUNCTION update_product_rating()
RETURNS TRIGGER AS $$
DECLARE
  pid INTEGER;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);

  UPDATE products SET rating = COALESCE(
    (SELECT ROUND(AVG(value), 1) FROM rates WHERE product_id = pid),
    0
  ) WHERE id = pid;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rate_rating ON rates;
CREATE TRIGGER trg_rate_rating
AFTER INSERT OR UPDATE OR DELETE ON rates
FOR EACH ROW EXECUTE FUNCTION update_product_rating();
