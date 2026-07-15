import { useCallback, useEffect, useState } from "react";
import { createAdminRecord, deleteAdminRecord, fetchAdmin, updateAdminRecord } from "../services/api";

const tabs = ["dashboard", "products", "categories", "orders", "users", "payments"];
const orderStatuses = ["pending", "paid", "processing", "shipped", "completed", "cancelled"];
const emptyProduct = { category_id: "", name: "", slug: "", description: "", image_url: "", price: "", stock: "" };
const emptyCategory = { name: "", slug: "" };

function money(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function date(value) {
  return value ? new Date(value).toLocaleString() : "—";
}

export default function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchAdmin(tab, tab === "dashboard" ? "" : `?page=${page}`);
      setData(result);
      if (tab === "products") {
        const categoryResult = await fetchAdmin("categories");
        setCategories(categoryResult.data || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => { setForm(null); load(); }, [load]);

  const records = data?.data || [];
  const remove = async (resource, id) => {
    if (!window.confirm("Delete this record? This action cannot be undone.")) return;
    try { await deleteAdminRecord(resource, id); await load(); } catch (err) { setError(err.message); }
  };

  const saveForm = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const resource = tab;
      const payload = resource === "products"
        ? { ...form, category_id: Number(form.category_id), price: Number(form.price), stock: Number(form.stock), slug: form.slug || null, image_url: form.image_url || null }
        : { ...form, slug: form.slug || null };
      if (form.id) await updateAdminRecord(resource, form.id, payload);
      else await createAdminRecord(resource, payload);
      setForm(null);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page page-shell">
      <div className="admin-heading"><div><span className="eyebrow">Protected workspace</span><h1>Shop administration</h1></div><span className="admin-badge">Administrator</span></div>
      <nav className="admin-tabs" aria-label="Admin sections">
        {tabs.map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => { setTab(item); setPage(1); }}>{item}</button>)}
      </nav>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <div className="admin-loading">Loading {tab}…</div> : (
        <>
          {tab === "dashboard" && <Dashboard data={data} onOpen={(item) => { setTab(item); setPage(1); }} />}
          {(tab === "products" || tab === "categories") && (
            <CatalogSection tab={tab} records={records} categories={categories} form={form} setForm={setForm} saveForm={saveForm} saving={saving} remove={remove} />
          )}
          {tab === "orders" && <Orders records={records} refresh={load} setError={setError} />}
          {tab === "users" && <Users records={records} refresh={load} setError={setError} />}
          {tab === "payments" && <Payments records={records} />}
          {data?.last_page > 1 && <div className="admin-pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Previous</button><span>Page {data.current_page} of {data.last_page}</span><button disabled={page === data.last_page} onClick={() => setPage((value) => value + 1)}>Next →</button></div>}
        </>
      )}
    </div>
  );
}

function Dashboard({ data, onOpen }) {
  return <div className="admin-dashboard">
    <div className="metric-grid">
      {[['Revenue', money(data.revenue)], ['Orders', data.counts.orders], ['Customers', data.counts.users], ['Products', data.counts.products], ['Pending', data.counts.pending_orders], ['Paid orders', data.counts.paid_orders]].map(([label, value]) => <div className="metric-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}
    </div>
    <div className="admin-split"><section className="admin-panel"><div className="panel-title"><h2>Recent orders</h2><button onClick={() => onOpen('orders')}>View all</button></div><OrderTable records={data.recent_orders} /></section>
    <section className="admin-panel"><div className="panel-title"><h2>Low stock</h2><button onClick={() => onOpen('products')}>Manage</button></div>{data.low_stock.length ? data.low_stock.map((product) => <div className="stock-row" key={product.id}><span>{product.name}<small>{product.category?.name}</small></span><b>{product.stock}</b></div>) : <p className="admin-empty">Stock levels look healthy.</p>}</section></div>
  </div>;
}

function CatalogSection({ tab, records, categories, form, setForm, saveForm, saving, remove }) {
  const isProduct = tab === "products";
  return <section className="admin-panel">
    <div className="panel-title"><div><h2>{isProduct ? "Products" : "Categories"}</h2><p>{records.length} records on this page</p></div><button className="admin-primary" onClick={() => setForm(isProduct ? emptyProduct : emptyCategory)}>+ Add {isProduct ? "product" : "category"}</button></div>
    {form && <form className="admin-form" onSubmit={saveForm}>
      <div className="panel-title"><h3>{form.id ? "Edit" : "New"} {isProduct ? "product" : "category"}</h3><button type="button" onClick={() => setForm(null)}>Close</button></div>
      {isProduct && <label>Category<select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Choose category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>}
      <label>Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>Slug <small>Optional</small><input value={form.slug || ""} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="Generated from name" /></label>
      {isProduct && <><label className="admin-form-wide">Description<textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label><label className="admin-form-wide">Image URL <small>Optional</small><input type="url" value={form.image_url || ""} onChange={(e) => setForm({ ...form, image_url: e.target.value })} /></label><label>Price<input required min="0" step="0.01" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label><label>Stock<input required min="0" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label></>}
      <button className="primary-button" disabled={saving}>{saving ? "Saving…" : "Save record"}</button>
    </form>}
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th>{isProduct && <><th>Category</th><th>Price</th><th>Stock</th></>} {!isProduct && <th>Products</th>}<th>Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><b>{record.name}</b><small>{record.slug}</small></td>{isProduct && <><td>{record.category?.name}</td><td>{money(record.price)}</td><td><span className={record.stock <= 5 ? "status warning" : "status"}>{record.stock}</span></td></>}{!isProduct && <td>{record.products_count}</td>}<td><div className="row-actions"><button onClick={() => setForm({ ...record, category_id: record.category_id || "" })}>Edit</button><button className="danger" onClick={() => remove(tab, record.id)}>Delete</button></div></td></tr>)}</tbody></table></div>
  </section>;
}

function OrderTable({ records, actions }) {
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th>{actions && <th>Update</th>}</tr></thead><tbody>{records.map((order) => <tr key={order.id}><td><b>#{order.id}</b><small>{order.items?.length || 0} items</small></td><td>{order.user?.name || "Deleted user"}</td><td>{money(order.total)}</td><td><span className={`status ${order.status}`}>{order.status}</span></td><td>{date(order.created_at)}</td>{actions && <td>{actions(order)}</td>}</tr>)}</tbody></table></div>;
}

function Orders({ records, refresh, setError }) {
  const update = async (order, status) => { try { await updateAdminRecord("orders", order.id, { status }); await refresh(); } catch (err) { setError(err.message); } };
  return <section className="admin-panel"><div className="panel-title"><h2>Orders and fulfillment</h2><p>Paid status is controlled by Bakong verification.</p></div><OrderTable records={records} actions={(order) => <select value={order.status} onChange={(event) => update(order, event.target.value)}>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select>} /></section>;
}

function Users({ records, refresh, setError }) {
  const toggle = async (user) => { try { await updateAdminRecord("users", user.id, { is_admin: !user.is_admin }); await refresh(); } catch (err) { setError(err.message); } };
  const remove = async (user) => { if (!window.confirm(`Delete ${user.name}?`)) return; try { await deleteAdminRecord("users", user.id); await refresh(); } catch (err) { setError(err.message); } };
  return <section className="admin-panel"><div className="panel-title"><h2>Users and roles</h2><p>Administrator access is enforced by the API.</p></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>User</th><th>Telegram ID</th><th>Orders</th><th>Joined</th><th>Role</th><th>Actions</th></tr></thead><tbody>{records.map((user) => <tr key={user.id}><td><b>{user.name}</b><small>{user.email}</small></td><td>{user.telegram_id || "—"}</td><td>{user.orders_count}</td><td>{date(user.created_at)}</td><td><button className={`role-toggle ${user.is_admin ? "active" : ""}`} onClick={() => toggle(user)}>{user.is_admin ? "Admin" : "Customer"}</button></td><td><button className="admin-delete" onClick={() => remove(user)}>Delete</button></td></tr>)}</tbody></table></div></section>;
}

function Payments({ records }) {
  return <section className="admin-panel"><div className="panel-title"><h2>Bakong payments</h2><p>Verified transaction records are read-only.</p></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Payment</th><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th><th>Paid at</th></tr></thead><tbody>{records.map((payment) => <tr key={payment.id}><td><b>#{payment.id}</b><small>{payment.provider}</small></td><td>#{payment.order_id}</td><td>{payment.order?.user?.name || "—"}</td><td>{payment.currency} {payment.amount}</td><td><span className={`status ${payment.status}`}>{payment.status}</span></td><td>{date(payment.paid_at)}</td></tr>)}</tbody></table></div></section>;
}
