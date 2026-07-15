import { useEffect, useMemo, useState } from "react";
import ProductCard from "../components/ProductCard";
import { fetchCategories, fetchProducts } from "../services/api";
import { useCart } from "../context/CartContext";

export default function Home({ onOpenProduct }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    let active = true;
    const loadCatalog = (showLoader = false) => {
      if (showLoader) setLoading(true);
      return Promise.all([fetchProducts(), fetchCategories()])
      .then(([items, groups]) => {
        if (!active) return;
        setProducts(items);
        setCategories(groups.map((group) => group.name));
        setError("");
      })
      .catch(() => active && setError("We couldn't load the collection. Please make sure the shop API is running."))
      .finally(() => active && setLoading(false));
    };
    loadCatalog(true);
    const refresh = () => loadCatalog(false);
    const onVisibility = () => { if (document.visibilityState === "visible") refresh(); };
    const interval = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
  const visible = useMemo(() => products.filter((product) =>
    (category === "All" || product.category === category) &&
    product.title.toLowerCase().includes(query.toLowerCase())), [products, category, query]);

  return (
    <div className="home-page page-shell">
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="eyebrow">The summer edit · 2026</span>
          <h1>Little things.<br /><em>Better days.</em></h1>
          <p>Thoughtful essentials, beautifully made for the rhythm of everyday life.</p>
          <button className="primary-button" onClick={() => document.querySelector("#collection")?.scrollIntoView({ behavior: "smooth" })}>Explore collection <span>→</span></button>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="sun-orb" />
          <div className="hero-card card-one"><span>🎧</span><small>Sound, elevated</small></div>
          <div className="hero-card card-two"><span>👜</span><small>Carry your day</small></div>
          <div className="floating-note">New season<br /><b>softly arrives</b></div>
        </div>
      </section>

      <section className="collection" id="collection">
        <div className="section-heading">
          <div><span className="eyebrow">Curated for you</span><h2>Shop the collection</h2></div>
          <label className="search-box">
            <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
          </label>
        </div>
        <div className="category-row">
          {["All", ...categories].map((item) => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
        </div>
        {error ? <div className="empty-search"><span>!</span><h3>Unable to load products</h3><p>{error}</p></div> : loading ? <div className="loading-grid">Loading beautiful things…</div> : products.length === 0 ? <div className="empty-search"><span>✦</span><h3>Collection coming soon</h3><p>No products have been added yet.</p></div> : (
          <div className="product-grid">
            {visible.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} onOpen={onOpenProduct} />)}
          </div>
        )}
        {products.length > 0 && visible.length === 0 && <div className="empty-search"><span>⌕</span><h3>No products found</h3><p>Try a different search or category.</p></div>}
      </section>
    </div>
  );
}
