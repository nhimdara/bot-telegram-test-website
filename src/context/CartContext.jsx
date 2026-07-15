import { useEffect, useMemo, useReducer } from "react";
import CartContext from "./cartState";

function reducer(state, action) {
  switch (action.type) {
    case "ADD": {
      const existing = state.find((item) => item.id === action.item.id);
      return existing
        ? state.map((item) => item.id === action.item.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...state, { ...action.item, quantity: 1 }];
    }
    case "CHANGE":
      return state
        .map((item) => item.id === action.id ? { ...item, quantity: Math.max(0, item.quantity + action.amount) } : item)
        .filter((item) => item.quantity > 0);
    case "REMOVE":
      return state.filter((item) => item.id !== action.id);
    case "CLEAR":
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, [], () => {
    try { return JSON.parse(localStorage.getItem("luma-cart")) || []; }
    catch { return []; }
  });

  useEffect(() => { localStorage.setItem("luma-cart", JSON.stringify(items)); }, [items]);

  const value = useMemo(() => ({
    items,
    addToCart: (item) => dispatch({ type: "ADD", item }),
    changeQuantity: (id, amount) => dispatch({ type: "CHANGE", id, amount }),
    removeFromCart: (id) => dispatch({ type: "REMOVE", id }),
    clearCart: () => dispatch({ type: "CLEAR" }),
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
