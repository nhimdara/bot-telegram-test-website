import useCart from "../context/useCart";
import ProductVisual from "./ProductVisual";

export default function Cart() {
  const { items, changeQuantity, removeFromCart } = useCart();
  return (
    <div className="cart-list">
      {items.map((item) => (
        <article className="cart-item" key={item.id}>
          <div className="cart-thumb" style={{ "--art-a": item.palette?.[0], "--art-b": item.palette?.[1] }}><ProductVisual product={item} /></div>
          <div className="cart-item-info">
            <span>{item.category}</span><h3>{item.title}</h3><small>{item.color}</small>
            <div className="quantity-control">
              <button onClick={() => changeQuantity(item.id, -1)}>−</button><b>{item.quantity}</b><button onClick={() => changeQuantity(item.id, 1)}>+</button>
            </div>
          </div>
          <div className="cart-item-end"><strong>${item.price * item.quantity}</strong><button onClick={() => removeFromCart(item.id)}>Remove</button></div>
        </article>
      ))}
    </div>
  );
}
