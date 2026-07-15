import { useCart } from "../context/CartContext";

const icons = {
  home: "M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-8.5Z",
  category: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  cart: "M3 4h2l2.3 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 1.9-1.4L21 7H6m4 12h.01M17 19h.01",
  profile: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
};

function NavIcon({ name }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={icons[name]} /></svg>;
}

export default function Navbar({ route, onNavigate }) {
  const { itemCount } = useCart();
  return (
    <>
      <header className="topbar">
        <button className="brand" onClick={() => onNavigate("home")}><span>l</span>Luma</button>
        <nav className="desktop-nav" aria-label="Main navigation">
          {[["home", "Discover"], ["category", "Categories"], ["cart", "Cart"], ["profile", "Profile"]].map(([key, label]) => (
            <button key={key} className={route === key ? "active" : ""} onClick={() => onNavigate(key)}>{label}</button>
          ))}
        </nav>
        <button className="header-cart" onClick={() => onNavigate("cart")} aria-label={`Cart with ${itemCount} items`}>
          <NavIcon name="cart" />{itemCount > 0 && <span>{itemCount}</span>}
        </button>
      </header>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[["home", "Discover"], ["category", "Categories"], ["cart", "Cart"], ["profile", "You"]].map(([key, label]) => (
          <button key={key} className={route === key ? "active" : ""} onClick={() => onNavigate(key)}>
            <span className="nav-icon"><NavIcon name={key} />{key === "cart" && itemCount > 0 && <i>{itemCount}</i>}</span>
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
