import { useCallback, useEffect, useState } from "react";
import { checkBakongPayment, fetchPaymentQr } from "../services/api";

function timeLeft(expiresAt) {
  const seconds = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function PaymentPage({ payment: initialPayment, onPaid, onBack, onRenew }) {
  const [payment, setPayment] = useState(initialPayment);
  const [qrUrl, setQrUrl] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(() => timeLeft(initialPayment.expires_at));
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    let objectUrl;
    fetchPaymentQr(initialPayment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setQrUrl(objectUrl);
      })
      .catch((err) => setError(err.message));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [initialPayment.id]);

  const checkPayment = useCallback(async (quiet = false) => {
    if (!quiet) setChecking(true);
    try {
      const latest = await checkBakongPayment(initialPayment.id);
      setPayment(latest);
      setError("");
      if (latest.status === "paid") onPaid(latest);
    } catch (err) {
      if (!quiet) setError(err.message);
    } finally {
      if (!quiet) setChecking(false);
    }
  }, [initialPayment.id, onPaid]);

  useEffect(() => {
    const clock = window.setInterval(() => setRemaining(timeLeft(payment.expires_at)), 1000);
    const poll = window.setInterval(() => checkPayment(true), 5000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(poll);
    };
  }, [checkPayment, payment.expires_at]);

  const expired = payment.status === "expired" || remaining === "00:00";

  return (
    <div className="payment-page page-shell">
      <button className="back-button" onClick={onBack}>← Back to shop</button>
      <div className="payment-layout">
        <section className="payment-card">
          <span className="eyebrow">Secure checkout</span>
          <h1>Pay with Bakong</h1>
          <p className="payment-intro">Scan this KHQR with Bakong or any supported Cambodian banking app.</p>
          <div className="qr-frame">
            {qrUrl ? <img src={qrUrl} alt="Bakong KHQR payment code" /> : <div className="qr-loading">Preparing KHQR…</div>}
          </div>
          <div className={`payment-timer ${expired ? "expired" : ""}`}>
            <span>{expired ? "QR expired" : "QR expires in"}</span>
            {!expired && <strong>{remaining}</strong>}
          </div>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button wide" disabled={checking || renewing} onClick={expired ? async () => {
            setRenewing(true);
            setError("");
            try { await onRenew(); } catch (err) { setError(err.message); setRenewing(false); }
          } : () => checkPayment()}>
            {renewing ? "Creating new KHQR…" : checking ? "Checking payment…" : expired ? "Create a new KHQR" : "I’ve completed payment"}
          </button>
          <p className="auto-check-note"><span /> Payment status checks automatically</p>
        </section>
        <aside className="payment-summary">
          <span className="eyebrow">Order #{payment.order_id}</span>
          <h2>Payment details</h2>
          <div><span>Payment method</span><b>Bakong KHQR</b></div>
          <div><span>Currency</span><b>{payment.currency}</b></div>
          <div className="payment-total"><span>Amount due</span><strong>{payment.currency === "USD" ? "$" : "៛"}{payment.amount}</strong></div>
          <div className="bakong-mark"><b>KHQR</b><span>Powered by Bakong</span></div>
        </aside>
      </div>
    </div>
  );
}
