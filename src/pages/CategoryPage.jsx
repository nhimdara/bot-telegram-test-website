import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { useCart } from "../context/CartContext";
import { fetchCategories, fetchProducts } from "../services/api";

const categoryStyles = [
  { label: "Life, connected", emoji: "🎧", colors: ["#f1dfca", "#b7825d"] },
  { label: "The finishing touch", emoji: "⌚", colors: ["#f2d5d2", "#bb7770"] },
  { label: "Made for your day", emoji: "✦", colors: ["#dce7e5", "#718e89"] },
];

export default function CategoryPage({ onOpenProduct }) {
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .then(([items, groups]) => {
        setProducts(items);
        setCollections(groups.map((group, index) => ({
          ...group,
          ...categoryStyles[index % categoryStyles.length],
        })));
      })
      .catch(() => setError("We couldn't load the categories. Please make sure the shop API is running."));
  }, []);
  const visibleProducts = useMemo(
    () => products.filter((product) => !selected || product.category === selected),
    [products, selected],
  );

  return (
    <div className="category-page page-shell">
      <header className="category-hero">
        <span className="eyebrow">Find your favourites</span>
        <h1>Shop by <em>category</em></h1>
        <p>Explore considered pieces for every part of your day.</p>
      </header>

      <div className="category-cards" aria-label="Product categories">
        {collections.map((collection, index) => (
          <button
            key={collection.name}
            className={selected === collection.name ? "active" : ""}
            onClick={() => setSelected(selected === collection.name ? null : collection.name)}
            style={{ "--category-a": collection.colors[0], "--category-b": collection.colors[1] }}
          >
            <span className="category-number">0{index + 1}</span>
            <span className="category-emoji">{collection.emoji}</span>
            <span className="category-label"><small>{collection.label}</small><strong>{collection.name}</strong></span>
            <i>↗</i>
          </button>
        ))}
      </div>

      <section className="category-products">
        <div className="category-products-title">
          <div><span className="eyebrow">{selected ? "Selected collection" : "Everything we love"}</span><h2>{selected || "All products"}</h2></div>
          {selected && <button onClick={() => setSelected(null)}>View all ×</button>}
        </div>
        {error ? <div className="empty-search"><span>!</span><h3>Unable to load categories</h3><p>{error}</p></div> : products.length === 0 ? <div className="loading-grid">Opening the collection…</div> : (
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={(item) => onOpenProduct(item, "category")} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
