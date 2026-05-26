CREATE OR REPLACE FUNCTION update_product_visible()
RETURNS TRIGGER AS $$
DECLARE
  pid INTEGER;
  has_stock BOOLEAN;
BEGIN
  pid := COALESCE(NEW.product_id, OLD.product_id);

  SELECT EXISTS (
    SELECT 1 FROM product_variants WHERE product_id = pid AND stock > 0
    UNION
    SELECT 1 FROM product_colors WHERE product_id = pid AND stock > 0
  ) INTO has_stock;

  IF EXISTS (
    SELECT 1 FROM product_variants WHERE product_id = pid
    UNION
    SELECT 1 FROM product_colors WHERE product_id = pid
  ) THEN
    UPDATE products SET visible = has_stock WHERE id = pid;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variant_stock ON product_variants;
CREATE TRIGGER trg_variant_stock
AFTER INSERT OR UPDATE OR DELETE ON product_variants
FOR EACH ROW EXECUTE FUNCTION update_product_visible();

DROP TRIGGER IF EXISTS trg_color_stock ON product_colors;
CREATE TRIGGER trg_color_stock
AFTER INSERT OR UPDATE OR DELETE ON product_colors
FOR EACH ROW EXECUTE FUNCTION update_product_visible();
