import { useCallback, useEffect, useState } from "react";
import { checkBakongPayment, checkPayWayPayment, fetchPaymentQr } from "../services/api";

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
  const isPayWay = initialPayment.provider === "payway";
  const isPayWaySandbox = isPayWay && initialPayment.environment === "sandbox";

  useEffect(() => {
    if (isPayWay) {
      setQrUrl(initialPayment.qr?.image || "");
      if (!initialPayment.qr?.image) setError("ABA PayWay did not return a QR image.");
      return undefined;
    }
    let objectUrl;
    fetchPaymentQr(initialPayment.id)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setQrUrl(objectUrl);
      })
      .catch((err) => setError(err.message));
    return () => objectUrl && URL.revokeObjectURL(objectUrl);
  }, [initialPayment.id, initialPayment.qr?.image, isPayWay]);

  const checkPayment = useCallback(async (quiet = false) => {
    if (!quiet) setChecking(true);
    try {
      const latest = isPayWay
        ? await checkPayWayPayment(initialPayment.id)
        : await checkBakongPayment(initialPayment.id);
      setPayment(latest);
      setError("");
      if (latest.status === "paid") onPaid(latest);
    } catch (err) {
      if (!quiet) setError(err.message);
    } finally {
      if (!quiet) setChecking(false);
    }
  }, [initialPayment.id, isPayWay, onPaid]);

  useEffect(() => {
    const clock = window.setInterval(() => setRemaining(timeLeft(payment.expires_at)), 1000);
    const poll = window.setInterval(() => checkPayment(true), 5000);
    return () => {
      window.clearInterval(clock);
      window.clearInterval(poll);
    };
  }, [checkPayment, payment.expires_at]);

  const expired = payment.status === "expired" || remaining === "00:00";
  const saveQr = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 720;
      canvas.height = 720;
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return setError("Unable to save this KHQR image.");
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${isPayWay ? "payway" : "bakong"}-khqr-order-${payment.order_id}.png`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      }, "image/png");
    };
    image.onerror = () => setError("Unable to prepare this KHQR image.");
    image.src = qrUrl;
  };

  return (
    <div className="payment-page page-shell">
      <button className="back-button" onClick={onBack}>← Back to shop</button>
      <div className="payment-layout">
        <section className="payment-card">
          <span className="eyebrow">Secure checkout</span>
          <h1>{isPayWay ? "Pay with ABA PayWay KHQR" : "Pay with any bank"}</h1>
          <p className="payment-intro">This KHQR can be paid from Cambodian banking apps that support KHQR.</p>
          {isPayWaySandbox && <p className="payment-warning sandbox-warning"><b>Sandbox QR:</b> Live ABA Mobile and banking apps cannot pay this test transaction. Choose Bakong KHQR for a real payment, or use ABA-issued production PayWay credentials.</p>}
          {!isPayWay && <p className="payment-warning"><b>Important:</b> Pay from a different bank or Bakong account. The receiving account cannot pay itself.</p>}
          <div className={`qr-frame ${isPayWay ? "payway-qr-frame" : ""}`}>
            {qrUrl ? <img src={qrUrl} alt={`${isPayWay ? "ABA PayWay" : "Bakong"} KHQR payment code`} /> : <div className="qr-loading">Preparing KHQR…</div>}
          </div>
          <div className={`payment-timer ${expired ? "expired" : ""}`}>
            <span>{expired ? "QR expired" : "QR expires in"}</span>
            {!expired && <strong>{remaining}</strong>}
          </div>
          <div className="khqr-instructions">
            <div><b>1</b><span>Open your banking app</span></div>
            <div><b>2</b><span>Choose Scan KHQR</span></div>
            <div><b>3</b><span>Confirm the amount</span></div>
          </div>
          {isPayWay && !isPayWaySandbox && payment.qr?.deeplink && <a className="save-qr-button" href={payment.qr.deeplink}>Open ABA Mobile</a>}
          {qrUrl && <button type="button" className="save-qr-button" onClick={saveQr}>Save KHQR for another bank app</button>}
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
          <div><span>Payment method</span><b>{isPayWay ? "ABA PayWay KHQR" : "Universal KHQR"}</b></div>
          <div><span>Currency</span><b>{payment.currency}</b></div>
          <div className="payment-total"><span>Amount due</span><strong>{payment.currency === "USD" ? "$" : "៛"}{payment.amount}</strong></div>
          <div className="bakong-mark"><b>{isPayWay ? "ABA PayWay" : "KHQR"}</b><span>Works with participating Cambodian banks</span></div>
        </aside>
      </div>
    </div>
  );
}
