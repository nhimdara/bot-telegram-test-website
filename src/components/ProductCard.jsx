import ProductVisual from "./ProductVisual";

export default function ProductCard({ product, onAdd, onOpen }) {
  return (
    <article className="product-card" onClick={() => onOpen?.(product)}>
      <div className="product-art" style={{ "--art-a": product.palette[0], "--art-b": product.palette[1] }}>
        {product.badge && <span className="product-badge">{product.badge}</span>}
        <button className="heart-button" aria-label={`Save ${product.title}`} onClick={(event) => event.stopPropagation()}>♡</button>
        <ProductVisual product={product} />
      </div>
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3>{product.title}</h3>
        <div className="product-meta">
          <div><strong>${product.price}</strong>{product.oldPrice && <del>${product.oldPrice}</del>}</div>
          <button className="add-button" aria-label={`Add ${product.title} to cart`} onClick={(event) => { event.stopPropagation(); onAdd?.(product); }}>+</button>
        </div>
      </div>
    </article>
  );
}
