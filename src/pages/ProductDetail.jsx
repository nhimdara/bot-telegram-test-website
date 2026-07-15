import { useEffect, useState } from "react";
import { fetchProductById } from "../services/api";
import { useCart } from "../context/CartContext";
import ProductVisual from "../components/ProductVisual";

export default function ProductDetail({ productId, onBack, onCart }) {
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  useEffect(() => {
    setProduct(null);
    setError("");
    fetchProductById(productId)
      .then(setProduct)
      .catch(() => setError("This product could not be loaded from the shop API."));
  }, [productId]);
  if (error) return <div className="detail-loading">{error} <button className="text-button" onClick={onBack}>Go back</button></div>;
  if (!product) return <div className="detail-loading">Finding your item…</div>;

  const add = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="detail-page page-shell">
      <button className="back-button" onClick={onBack}>← <span>Back to collection</span></button>
      <div className="detail-layout">
        <div className="detail-art" style={{ "--art-a": product.palette[0], "--art-b": product.palette[1] }}>
          {product.badge && <span className="product-badge">{product.badge}</span>}
          <ProductVisual product={product} detail />
          <span className="art-caption">Luma / {product.category}</span>
        </div>
        <div className="detail-copy">
          <span className="eyebrow">{product.category} · {product.color}</span>
          <h1>{product.title}</h1>
          <div className="rating"><b>★ {product.rating}</b><span>{product.reviews} verified reviews</span></div>
          <div className="detail-price"><strong>${product.price}</strong>{product.oldPrice && <del>${product.oldPrice}</del>}</div>
          <p className="detail-description">{product.description}</p>
          <div className="feature-list">
            <div><span>✦</span><p><b>Made thoughtfully</b><small>Quality materials, considered design</small></p></div>
            <div><span>↺</span><p><b>30-day returns</b><small>Easy, no-stress exchanges</small></p></div>
          </div>
          <button className={`primary-button wide ${added ? "added" : ""}`} onClick={add}>{added ? "Added to your bag ✓" : `Add to bag · $${product.price}`}</button>
          <button className="text-button" onClick={onCart}>View your bag →</button>
        </div>
      </div>
    </div>
  );
}
