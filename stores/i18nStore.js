import { i18nStore } from "react-i18nify-mobx";
import { makeAutoStoreHandler, getLocalStorage } from "./autoStore.js";
import { observable, autorun } from "mobx";

i18nStore.setTranslations({
  en: {
    login: {
      username: "Username",
      password: "Password",
      submit: "Login",
      title: "authentication",
      logged: "You're in!"
    }
  },
  de: {
    login: {
      username: "Benutzer",
      password: "Passwort",
      submit: "Einloggen",
      title: "Authentifizierung",
      logged: "Willkommen!"
    }
  },
  fr: {
    login: {
      username: "Nom d'utilisateur",
      password: "Mot de passe",
      submit: "S'identifier",
      title: "authentification",
      logged: "Connecté!"
    }
  }
});

i18nStore.user = observable.object({ lang: "fr" });

if (global.navigator) {
  makeAutoStoreHandler("language")(i18nStore.user, "lang");
  console.log("Language: ", i18nStore.user.lang);
  autorun(() => {
    i18nStore.setLocale(i18nStore.user.lang);
  });
  if(!i18nStore.user.lang || i18nStore.user.lang.length != 2) i18nStore.user.lang = (navigator.language || navigator.userLanguage).substring(0, 2);
  window.i18n = i18nStore;
}

export default i18nStore;
