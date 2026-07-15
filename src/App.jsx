import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import PaymentPage from "./pages/PaymentPage";
import AdminPage from "./pages/AdminPage";
import { CartProvider } from "./context/CartContext";
import { initializeTelegram } from "./services/telegram";
import { createBakongPayment } from "./services/api";

export default function App() {
  const [route, setRoute] = useState("home");
  const [productId, setProductId] = useState(null);
  const [productBackRoute, setProductBackRoute] = useState("home");
  const [telegramUser, setTelegramUser] = useState(null);
  const [telegramError, setTelegramError] = useState("");
  const [checkout, setCheckout] = useState(null);
  const [paid, setPaid] = useState(false);
  useEffect(() => {
    initializeTelegram()
      .then(setTelegramUser)
      .catch(() =>
        setTelegramError(
          "Telegram sign-in failed. Please reopen the shop from the bot.",
        ),
      );
  }, []);
  const navigate = (next) => {
    setRoute(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openProduct = (product, from = "home") => {
    setProductId(product.id);
    setProductBackRoute(from);
    navigate("product");
  };

  return (
    <CartProvider>
      <div className="app">
        <Navbar
          route={route === "product" ? productBackRoute : route}
          onNavigate={navigate}
          isAdmin={Boolean(telegramUser?.is_admin)}
        />
        <main>
          {route === "home" && <Home onOpenProduct={openProduct} />}
          {route === "category" && <CategoryPage onOpenProduct={openProduct} />}
          {route === "product" && (
            <ProductDetail
              productId={productId}
              onBack={() => navigate(productBackRoute)}
              onCart={() => navigate("cart")}
            />
          )}
          {route === "cart" && <CartPage onShop={() => navigate("home")} onPayment={(value) => { setCheckout(value); navigate("payment"); }} />}
          {route === "payment" && checkout && !paid && (
            <PaymentPage
              key={checkout.payment.expires_at}
              payment={checkout.payment}
              onBack={() => navigate("home")}
              onPaid={() => setPaid(true)}
              onRenew={async () => {
                const payment = await createBakongPayment(checkout.order.id);
                setCheckout((current) => ({ ...current, payment }));
              }}
            />
          )}
          {route === "payment" && paid && (
            <PaymentSuccess onContinue={() => { setPaid(false); setCheckout(null); navigate("home"); }} />
          )}
          {route === "profile" && (
            <Profile
              user={telegramUser}
              error={telegramError}
              onShop={() => navigate("home")}
            />
          )}
          {route === "admin" && telegramUser?.is_admin && <AdminPage />}
          {route === "admin" && !telegramUser?.is_admin && (
            <div className="empty-cart page-shell"><h1>Administrator access required</h1><p>This page is available only to configured shop administrators.</p></div>
          )}
        </main>
        <footer>
          <button className="brand" onClick={() => navigate("home")}>
            <span>l</span>Luma
          </button>
          <p>Objects for slower, softer living.</p>
          <small>© 2026 Luma Goods</small>
        </footer>
      </div>
    </CartProvider>
  );
}

function PaymentSuccess({ onContinue }) {
  return <div className="success-state page-shell"><span>✓</span><h1>Payment received</h1><p>Your Bakong payment is confirmed. We’ll send delivery updates in Telegram.</p><button className="primary-button" onClick={onContinue}>Continue shopping</button></div>;
}
