import { useCallback, useEffect, useState } from "react";
import { checkPayWayPayment } from "../services/api";

export default function PayWayReturnPage({ paymentId, cancelled, onContinue }) {
  const [status, setStatus] = useState(cancelled ? "cancelled" : "checking");
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    if (!paymentId || cancelled) return;
    setStatus("checking");
    setError("");
    try {
      const payment = await checkPayWayPayment(paymentId);
      setStatus(payment.status === "paid" ? "paid" : "pending");
    } catch (err) {
      setStatus("pending");
      setError(err.message);
    }
  }, [paymentId, cancelled]);

  useEffect(() => { check(); }, [check]);

  const paid = status === "paid";
  return (
    <div className="success-state page-shell">
      <span>{paid ? "✓" : status === "cancelled" ? "×" : "…"}</span>
      <h1>{paid ? "Payment received" : status === "cancelled" ? "Payment cancelled" : "Confirming payment"}</h1>
      <p>{paid ? "ABA PayWay confirmed your payment. We’ll send delivery updates in Telegram." : status === "cancelled" ? "No payment was taken. You can return to your bag and try again." : "If you completed checkout, ABA may need a few seconds to confirm it."}</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      {status === "pending" && <button className="secondary-button" onClick={check}>Check again</button>}
      <button className="primary-button" onClick={onContinue}>{paid ? "Continue shopping" : "Return to shop"}</button>
    </div>
  );
}
