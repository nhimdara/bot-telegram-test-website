import { authenticateTelegram, getStoredTelegramUser } from "./api";

let authentication;

export function initializeTelegram() {
  if (authentication) return authentication;

  const webApp = window.Telegram?.WebApp;
  if (!webApp?.initData) {
    return Promise.resolve(getStoredTelegramUser());
  }

  webApp.ready();
  webApp.expand();
  webApp.setHeaderColor("#f8f6f0");
  webApp.setBackgroundColor("#f8f6f0");

  authentication = authenticateTelegram(webApp.initData).catch((error) => {
    authentication = null;
    throw error;
  });

  return authentication;
}
