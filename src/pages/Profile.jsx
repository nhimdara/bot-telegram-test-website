export default function Profile({ user, error, onShop }) {
  const name = user?.name || "Telegram shopper";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="profile-page page-shell">
      <section className="profile-card">
        <div className="avatar">{initial}</div><span className="eyebrow">Luma member</span><h1>Hello, {name}</h1><p>{error || (user ? "Connected securely through Telegram." : "Open this shop from Telegram to connect your profile.")}</p>
      </section>
      <div className="profile-grid">
        <button><span>◫</span><div><b>Your orders</b><small>Track and view purchases</small></div><i>→</i></button>
        <button><span>♡</span><div><b>Saved items</b><small>Your favourites in one place</small></div><i>→</i></button>
        <button><span>⌁</span><div><b>Delivery details</b><small>Addresses and contact info</small></div><i>→</i></button>
        <button onClick={onShop}><span>✦</span><div><b>Member edit</b><small>Curated picks just for you</small></div><i>→</i></button>
      </div>
      <div className="member-note"><b>Good things, first.</b><span>You’ll be the first to know about new drops and quiet little offers.</span></div>
    </div>
  );
}
