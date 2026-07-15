import { useEffect, useState } from "react";

export default function ProductVisual({ product, detail = false }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [product.image_url]);

  if (product.image_url && !failed) {
    return <img className={detail ? "detail-product-image" : "product-image"} src={product.image_url} alt={product.title} loading="lazy" onError={() => setFailed(true)} />;
  }

  return <span className={detail ? "detail-emoji" : "product-emoji"} aria-hidden="true">{product.emoji}</span>;
}
