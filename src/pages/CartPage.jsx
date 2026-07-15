import { useState } from "react";
import Cart from "../components/Cart";
import { useCart } from "../context/CartContext";
import { createBakongPayment, createOrder, createPayWayPayment, replaceServerCart, submitPayWayCheckout } from "../services/api";

export default function CartPage({ onShop, onPayment }) {
  const { items, subtotal, clearCart } = useCart();
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pendingOrder, setPendingOrder] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("bakong");
  if (!items.length) return <div className="empty-cart page-shell"><div className="empty-bag">Bag</div><h1>Your bag is feeling light</h1><p>Discover something lovely and come back when you’re ready.</p><button className="primary-button" onClick={onShop}>Browse the collection →</button></div>;

  const checkout = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let order = pendingOrder;
      if (!order) {
        await replaceServerCart(items);
        order = await createOrder(address, notes);
        setPendingOrder(order);
      }
      if (paymentMethod === "payway") {
        const payment = await createPayWayPayment(order.id);
        clearCart();
        submitPayWayCheckout(payment.checkout);
        return;
      }
      const payment = await createBakongPayment(order.id);
      clearCart();
      onPayment({ order, payment });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cart-page page-shell">
      <div className="cart-title"><span className="eyebrow">Your selection</span><h1>Shopping bag <small>{items.length}</small></h1></div>
      <div className="cart-layout">
        <Cart />
        <form className="order-summary" onSubmit={checkout}>
          <h2>Order summary</h2>
          <div><span>Subtotal</span><b>${subtotal}</b></div>
          <div><span>Shipping</span><b>Free</b></div>
          <div className="summary-total"><span>Total</span><strong>${subtotal}</strong></div>
          <label className="checkout-field">Delivery address<input value={address} onChange={(event) => setAddress(event.target.value)} maxLength="255" required placeholder="Street, city, province" /></label>
          <label className="checkout-field">Order note <small>Optional</small><textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength="2000" placeholder="Delivery instructions" /></label>
          <fieldset className="payment-methods">
            <legend>Payment method</legend>
            <label className={paymentMethod === "bakong" ? "selected" : ""}><input type="radio" name="payment_method" value="bakong" checked={paymentMethod === "bakong"} onChange={() => setPaymentMethod("bakong")} /><span><b>Bakong KHQR</b><small>Scan with Cambodian banking apps</small></span></label>
            <label className={paymentMethod === "payway" ? "selected" : ""}><input type="radio" name="payment_method" value="payway" checked={paymentMethod === "payway"} onChange={() => setPaymentMethod("payway")} /><span><b>ABA PayWay</b><small>ABA Pay, KHQR, cards and enabled wallets</small></span></label>
          </fieldset>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button wide" disabled={submitting}>{submitting ? "Preparing payment…" : paymentMethod === "payway" ? "Continue to ABA PayWay →" : "Pay with Bakong →"}</button>
          <p>{paymentMethod === "payway" ? "Secure checkout hosted by ABA PayWay" : "Secure Bakong KHQR checkout"}</p>
        </form>
      </div>
    </div>
  );
}
