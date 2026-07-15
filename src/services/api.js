const API_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

const categoryLooks = {
  electronics: { palette: ["#f1dfca", "#b7825d"], emoji: "🎧" },
  accessories: { palette: ["#f2d5d2", "#bb7770"], emoji: "⌚" },
  sneakers: { palette: ["#d9d1ff", "#8f7bd8"], emoji: "👟" },
  bags: { palette: ["#dbe8d7", "#718c69"], emoji: "👜" },
  home: { palette: ["#e7d9c7", "#a7886e"], emoji: "🪑" },
};

function lookFor(category) {
  const key = (category?.slug || category?.name || "").toLowerCase();
  return categoryLooks[key] || { palette: ["#dce7e5", "#718e89"], emoji: "✦" };
}

async function request(path, options = {}) {
  const token = sessionStorage.getItem("telegram-shop-token");
  const { responseType, ...fetchOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const validationMessage = body?.errors
      ? Object.values(body.errors).flat().find(Boolean)
      : null;
    throw new Error(
      validationMessage || body?.message || `API request failed (${response.status})`,
    );
  }

  if (responseType === "blob") return response.blob();
  if (response.status === 204) return null;
  return response.json();
}

function mapProduct(product) {
  const look = lookFor(product.category);

  return {
    ...product,
    title: product.name,
    category: product.category?.name || "Uncategorized",
    price: Number(product.price),
    rating: product.rating ?? 4.8,
    reviews: product.reviews ?? 0,
    badge: product.stock === 0 ? "Sold out" : product.badge,
    color: product.stock > 0 ? `${product.stock} in stock` : "Out of stock",
    palette: product.palette || look.palette,
    emoji: product.emoji || look.emoji,
    description: product.description || "A thoughtfully selected piece from the Luma collection.",
  };
}

export async function fetchProducts() {
  const products = await request("/products");
  return products.map(mapProduct);
}

export async function fetchProductById(id) {
  const product = await request(`/products/${encodeURIComponent(id)}`);
  return mapProduct(product);
}

export async function fetchCategories() {
  return request("/categories");
}

export async function authenticateTelegram(initData) {
  const auth = await request("/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ init_data: initData }),
  });

  sessionStorage.setItem("telegram-shop-token", auth.token);
  sessionStorage.setItem("telegram-shop-user", JSON.stringify(auth.user));
  return auth.user;
}

export function getStoredTelegramUser() {
  try {
    return JSON.parse(sessionStorage.getItem("telegram-shop-user"));
  } catch {
    return null;
  }
}

export async function replaceServerCart(items) {
  await request("/cart", { method: "DELETE" });
  for (const item of items) {
    await request("/cart/items", {
      method: "POST",
      body: JSON.stringify({ product_id: item.id, quantity: item.quantity }),
    });
  }
}

export function createOrder(address, notes = "") {
  return request("/orders", {
    method: "POST",
    body: JSON.stringify({ address, notes: notes || null }),
  });
}

export function createBakongPayment(orderId) {
  return request(`/orders/${encodeURIComponent(orderId)}/payment`, {
    method: "POST",
  });
}

export function checkBakongPayment(paymentId) {
  return request(`/payments/${encodeURIComponent(paymentId)}/check`, {
    method: "POST",
  });
}

export function fetchPaymentQr(paymentId) {
  return request(`/payments/${encodeURIComponent(paymentId)}/qr`, {
    responseType: "blob",
  });
}

export function fetchAdmin(resource, query = "") {
  return request(`/admin/${resource}${query}`);
}

export function createAdminRecord(resource, data) {
  return request(`/admin/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateAdminRecord(resource, id, data) {
  return request(`/admin/${resource}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteAdminRecord(resource, id) {
  return request(`/admin/${resource}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
