import { useState } from "react";
import Cart from "../components/Cart";
import { useCart } from "../context/CartContext";

export default function CartPage({ onShop }) {
  const { items, subtotal, clearCart } = useCart();
  const [ordered, setOrdered] = useState(false);
  if (ordered) return <div className="success-state page-shell"><span>✓</span><h1>Order received</h1><p>We’ll send an update in Telegram as soon as your parcel is on its way.</p><button className="primary-button" onClick={() => { clearCart(); onShop(); }}>Continue shopping</button></div>;
  if (!items.length) return <div className="empty-cart page-shell"><div className="empty-bag">Bag</div><h1>Your bag is feeling light</h1><p>Discover something lovely and come back when you’re ready.</p><button className="primary-button" onClick={onShop}>Browse the collection →</button></div>;

  const shipping = subtotal >= 120 ? 0 : 8;
  return (
    <div className="cart-page page-shell">
      <div className="cart-title"><span className="eyebrow">Your selection</span><h1>Shopping bag <small>{items.length}</small></h1></div>
      <div className="cart-layout">
        <Cart />
        <aside className="order-summary">
          <h2>Order summary</h2>
          <div><span>Subtotal</span><b>${subtotal}</b></div>
          <div><span>Shipping</span><b>{shipping ? `$${shipping}` : "Free"}</b></div>
          <div className="summary-total"><span>Total</span><strong>${subtotal + shipping}</strong></div>
          <button className="primary-button wide" onClick={() => setOrdered(true)}>Checkout securely →</button>
          <p>Secure checkout · 30-day returns</p>
        </aside>
      </div>
    </div>
  );
}
