import { i18nStore } from "react-i18nify-mobx";
import { makeAutoStoreHandler, getLocalStorage } from "./autoStore.js";
import { observable, autorun, toJS } from "mobx";

i18nStore.setTranslations({
  en: {
    common: {
      loading: "Loading, please wait..."
    },
    nav: {
      home_name: "Home",
      home_description: "start page",
      gallery_name: "Gallery",
      gallery_description: "View newest creations",
      new_name: "New",
      new_description: "Create a new tile",
      show_name: "Show",
      show_description: "View artists work",
      login_name: "Login",
      login_description: "Login as member",
      logout_name: "Logout",
      logout_description: "Logged in as",
      lang_name: "Language",
      lang_description: "choose the language"
    },
    login: {
      username: "Username",
      password: "Password",
      submit: "Login",
      title: "authentication",
      logged: "You're in!",
      unauthorized: "Unauthorized - Please login"
    }
  },
  de: {
    common: {
      loading: "Laden, bitte warten..."
    },
    nav: {
      home_name: "Home",
      home_description: "Startseite",
      gallery_name: "Galerie",
      gallery_description: "Neueste Kreationen ansehen",
      new_name: "Neu",
      new_description: "Neue Kachel erstellen",
      show_name: "Show",
      show_description: "Siehe die Arbeit der Künstler",
      list_name: "Tree",
      list_description: "Entdecke Baumstruktur",
      login_name: "Login",
      login_description: "Einloggen als Mitglied",
      logout_name: "Logout",
      logout_description: "Eingeloggt als",
      lang_name: "Sprache",
      lang_description: "Sprache auswählen"
    },
    login: {
      username: "Benutzer",
      password: "Passwort",
      submit: "Einloggen",
      title: "Authentifizierung",
      logged: "Willkommen!",
      unauthorized: "Nicht autorisiert - Bitte einloggen"
    }
  },
  fr: {
    common: {
      loading: "Chargement, veuillez patienter..."
    },
    nav: {
      home_name: "Home",
      home_description: "Page d'accueil",
      gallery_name: "Galerie",
      gallery_description: "Voir les dernières créations",
      new_name: "New",
      new_description: "Créer une nouvelle tuile",
      show_name: "Show",
      show_description: "Voir le travail des artistes",
      login_name: "Login",
      login_description: "se connecter en tant que membre",
      logout_name: "Logout",
      logout_description: "Connecté en tant que",
      lang_name: "Langue",
      lang_description: "Choisir la langue"
    },
    login: {
      username: "Nom d'utilisateur",
      password: "Mot de passe",
      submit: "S'identifier",
      title: "authentification",
      logged: "Connecté!",
      unauthorized: "Non autorisé - Veuillez vous connecter"
    }
  }
});

i18nStore.user = observable.object({ lang: "" });

if (global.navigator) {
  makeAutoStoreHandler("language")(i18nStore.user, "lang");

  autorun(() => {
    i18nStore.setLocale(i18nStore.user.lang);
    //console.log("Language: ", i18nStore.user.lang);
  });

  if(typeof i18nStore.user.lang != "string" || i18nStore.user.lang.length != 2) {
    i18nStore.user.lang = navigator.language.substring(0, 2);
  }

  if(!i18nStore.user.lang || i18nStore.user.lang.length != 2)
    i18nStore.user.lang = (navigator.language || navigator.userLanguage).substring(0, 2);
  window.i18n = i18nStore;
  window.toJS = toJS;
}

export default i18nStore;
