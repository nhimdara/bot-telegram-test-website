import { authenticateTelegram, fetchProfile, getStoredTelegramUser } from "./api";

let authentication;

export function initializeTelegram() {
  if (authentication) return authentication;

  const webApp = window.Telegram?.WebApp;
  if (!webApp?.initData) {
    const storedUser = getStoredTelegramUser();
    if (!storedUser || !sessionStorage.getItem("telegram-shop-token")) {
      return Promise.resolve(storedUser);
    }
    return fetchProfile().then((user) => {
      sessionStorage.setItem("telegram-shop-user", JSON.stringify(user));
      return user;
    });
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
