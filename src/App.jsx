import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CartPage from "./pages/CartPage";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetail";
import CategoryPage from "./pages/CategoryPage";
import { CartProvider } from "./context/CartContext";
import { initializeTelegram } from "./services/telegram";

export default function App() {
  const [route, setRoute] = useState("home");
  const [productId, setProductId] = useState(null);
  const [productBackRoute, setProductBackRoute] = useState("home");
  const [telegramUser, setTelegramUser] = useState(null);
  const [telegramError, setTelegramError] = useState("");
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
          {route === "cart" && <CartPage onShop={() => navigate("home")} />}
          {route === "profile" && (
            <Profile
              user={telegramUser}
              error={telegramError}
              onShop={() => navigate("home")}
            />
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
