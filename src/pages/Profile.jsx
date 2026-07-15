import { useCallback, useEffect, useState } from "react";
import { cancelOrder, fetchOrders } from "../services/api";

function formatAmount(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

export default function Profile({ user, error, onShop }) {
  const name = user?.name || "Telegram shopper";
  const initial = name.charAt(0).toUpperCase();
  const [orders, setOrders] = useState([]);
  const [ordersOpen, setOrdersOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    setOrdersError("");
    try {
      setOrders(await fetchOrders());
    } catch (requestError) {
      setOrdersError(requestError.message);
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (ordersOpen && user && !orders.length) loadOrders();
  }, [loadOrders, orders.length, ordersOpen, user]);

  const cancel = async (orderId) => {
    setOrdersError("");
    try {
      const updated = await cancelOrder(orderId);
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
    } catch (requestError) {
      setOrdersError(requestError.message);
    }
  };

  return (
    <div className="profile-page page-shell">
      <section className="profile-card">
        <div className="avatar">{initial}</div><span className="eyebrow">Luma member</span><h1>Hello, {name}</h1><p>{error || (user ? "Connected securely through Telegram." : "Open this shop from Telegram to connect your profile.")}</p>
      </section>
      <div className="profile-grid">
        <button onClick={() => setOrdersOpen((open) => !open)}><span>◫</span><div><b>Your orders</b><small>Track and view purchases</small></div><i>{ordersOpen ? "×" : "→"}</i></button>
        <button><span>♡</span><div><b>Saved items</b><small>Your favourites in one place</small></div><i>→</i></button>
        <button><span>⌁</span><div><b>Delivery details</b><small>Addresses and contact info</small></div><i>→</i></button>
        <button onClick={onShop}><span>✦</span><div><b>Member edit</b><small>Curated picks just for you</small></div><i>→</i></button>
      </div>
      {ordersOpen && <section className="profile-orders">
        <div className="profile-orders-heading"><div><span className="eyebrow">Order history</span><h2>Your purchases</h2></div><button onClick={loadOrders} disabled={ordersLoading}>Refresh</button></div>
        {ordersError && <p className="form-error" role="alert">{ordersError}</p>}
        {ordersLoading ? <p className="profile-orders-empty">Loading orders…</p> : orders.length === 0 ? <p className="profile-orders-empty">You haven’t placed an order yet.</p> : <div className="profile-order-list">{orders.map((order) => <article key={order.id}>
          <div><b>Order #{order.id}</b><small>{new Date(order.created_at).toLocaleString()} · {order.items?.length || 0} item(s)</small></div>
          <div className="profile-order-payment"><strong>{formatAmount(order.total)}</strong><span className={`status ${order.status}`}>{order.status}</span></div>
          <small>{order.payment ? `${order.payment.provider === "payway" ? "ABA PayWay" : "Bakong"} · ${order.payment.status}` : "Payment not started"}</small>
          {order.status === "pending" && <button className="text-button" onClick={() => cancel(order.id)}>Cancel order</button>}
        </article>)}</div>}
      </section>}
      <div className="member-note"><b>Good things, first.</b><span>You’ll be the first to know about new drops and quiet little offers.</span></div>
    </div>
  );
}
