import React from "react";
import Link from "next/link";
import { withRouter } from "next/router";
import classNames from "classnames";
import LoginForm from "./login.js";
import Modal from "react-modal";
import { inject, observer } from "mobx-react";
import { set } from "mobx";
import { HSLA, Timer } from "../utils/dom.js";
import Util from "../utils/util.js";
import Alea from "../utils/alea.js";
import ReactCountryFlag from "react-country-flag";
import { Translate, Localize } from "react-i18nify-mobx";

const LoginIcon = ({ style }) => (
  <svg style={style} height="56" width="34" viewBox="0 0 8.996 14.817" xmlns="http://www.w3.org/2000/svg">
    <defs />
    <path d="M4.533 9.58c-.702-.006-1.405-.003-2.108-.027a86.888 86.888 0 01-1.143-1.975c.16.028.44-.115.498.107.227.418.499.814.689 1.25.099.084.147.303.346.237 1.226.036 2.453.018 3.68.023.639-1.083 1.3-2.153 1.923-3.244-.61-1.104-1.258-2.186-1.886-3.279l-3.85-.012-.952 1.586h-.444c.4-.661.794-1.326 1.188-1.991 1.42.03 2.841.018 4.262.023.723 1.218 1.424 2.45 2.136 3.675-.704 1.172-1.386 2.359-2.111 3.519-.31.246-.833.045-1.226.112-.334 0-.668-.002-1.001-.004zm-.647-1.235c-.441-.37.296-.751.511-1.041.214-.22.427-.479.665-.707.121-.175.678-.553.166-.467-1.615-.023-3.23.015-4.845-.026-.47.028-.22-.606.154-.45 1.622-.032 3.245.003 4.866-.02-.102-.218-.457-.412-.585-.653-.307-.254-.56-.576-.84-.863-.294-.154-.305-.736.133-.592.376.372.748.755 1.093 1.155.082.151.357.326.513.528.143.317.653.454.56.85a54.267 54.267 0 01-2.219 2.3c-.05.014-.132.025-.172-.014zm.435 1.236l-1.898-.013c-.38-.663-.777-1.318-1.14-1.99.158.022.435-.114.495.104l.86 1.483c1.285.029 2.57.03 3.855.03.636-1.076 1.285-2.145 1.913-3.225-.312-.665-.727-1.279-1.082-1.923-.261-.451-.523-.903-.783-1.356-1.286-.046-2.573-.024-3.86-.029-.318.522-.615 1.06-.953 1.566-.09-.015-.544.1-.377-.09l1.117-1.876c1.408.014 2.817-.009 4.225.038.28.228.4.647.617.948.523.901 1.045 1.804 1.566 2.707L6.7 9.604c-.792-.017-1.59-.02-2.379-.023zm-.408-1.218c-.477-.297.163-.703.37-.96.39-.426.82-.82 1.188-1.264-1.75-.043-3.501.013-5.25-.046-.24-.179-.024-.537.238-.443 1.644-.01 3.288.009 4.931-.033-.53-.597-1.127-1.138-1.62-1.766-.16-.427.455-.44.58-.095.635.668 1.275 1.332 1.895 2.012.208.365-.335.601-.5.867-.564.565-1.08 1.182-1.69 1.699a.181.181 0 01-.142.029zm.222 1.224c-.566-.003-1.133-.004-1.7-.006-.406-.665-.782-1.348-1.176-2.02l.46.013c.308.528.614 1.058.917 1.59 1.284.014 2.568.032 3.852.028.641-1.074 1.287-2.146 1.919-3.226-.345-.705-.782-1.365-1.162-2.053L6.537 2.69c-1.283-.027-2.567-.03-3.85-.029l-.942 1.574-.467.012c.4-.666.796-1.334 1.193-2.002a244.2 244.2 0 004.28.03c.694 1.203 1.402 2.399 2.08 3.61-.003.343-.34.634-.48.955L6.702 9.6c-.854-.011-1.72-.019-2.567-.014zm-.246-1.23c-.423-.26.097-.62.285-.844.423-.465.884-.896 1.298-1.368-1.704-.01-3.41.02-5.113-.018-.337.03-.297-.534.009-.475l5.029-.024c-.546-.582-1.103-1.154-1.633-1.75-.16-.438.439-.486.58-.13.648.684 1.313 1.354 1.93 2.066.108.386-.39.595-.578.88-.532.552-1.057 1.113-1.611 1.643a.195.195 0 01-.196.02zm.048 1.23L2.423 9.58c-.39-.674-.779-1.347-1.17-2.02l.468.012.92 1.586c1.28.019 2.561.034 3.842.035.652-1.077 1.29-2.163 1.938-3.243-.628-1.087-1.258-2.172-1.886-3.26a227.615 227.615 0 00-3.85-.028l-.934 1.583-.474.003c.405-.663.795-1.335 1.194-2.001 1.427.018 2.855.032 4.282.028.705 1.228 1.428 2.446 2.12 3.68-.714 1.22-1.445 2.432-2.168 3.648a350.07 350.07 0 00-2.768-.017zm-.1-1.254c-.353-.38.29-.69.484-.977l1.167-1.21-5.235-.012c-.364-.293.069-.588.397-.475 1.581-.02 3.162-.02 4.743-.03-.538-.584-1.112-1.138-1.619-1.748-.192-.417.432-.501.568-.136.644.675 1.295 1.344 1.919 2.037.168.393-.367.614-.546.896-.528.542-1.049 1.093-1.577 1.635a.243.243 0 01-.3.02zm-.105 1.254l-1.31-.006c-.39-.674-.779-1.347-1.17-2.02l.473.013c.312.52.593 1.068.93 1.566 1.012.059 2.028.035 3.042.05l.786.007 1.935-3.248c-.63-1.085-1.255-2.172-1.884-3.257-1.282-.02-2.564-.026-3.846-.036L1.75 4.24c-.22.006-.62.079-.336-.225l1.053-1.77c1.432.017 2.864.013 4.295.051a281.463 281.463 0 012.11 3.658c-.709 1.223-1.445 2.431-2.164 3.65-.992-.008-1.988-.015-2.978-.018zm.115-1.245c-.38-.318.129-.645.378-.89.413-.436.841-.859 1.242-1.306L.245 6.134c-.33-.265.03-.6.368-.473 1.59-.023 3.182-.022 4.773-.032-.533-.59-1.106-1.146-1.624-1.75-.171-.391.414-.537.556-.164.659.693 1.332 1.373 1.955 2.099.09.418-.454.66-.667.978-.507.51-.978 1.057-1.505 1.543a.224.224 0 01-.254.007zm-.3 1.245L2.415 9.58c-.38-.671-.77-1.338-1.155-2.006.255-.01.557-.062.62.266.257.437.504.88.769 1.312 1.278.034 2.557.027 3.836.04L8.416 5.95c-.628-1.076-1.24-2.162-1.881-3.232-1.21-.06-2.423-.037-3.634-.055-.16-.035-.269.018-.318.176-.279.468-.548.941-.84 1.4-.242.08-.62.069-.328-.224.348-.587.699-1.173 1.048-1.759 1.435 0 2.869.01 4.303.035.7 1.223 1.423 2.432 2.108 3.663-.7 1.224-1.436 2.427-2.154 3.64-1.057 0-2.119.004-3.172-.007zm.278-1.262c-.339-.332.23-.631.406-.883.408-.43.821-.857 1.232-1.285L.245 6.132c-.305-.228-.022-.605.311-.483 1.61-.022 3.222-.015 4.832-.022-.536-.57-1.079-1.135-1.608-1.712-.232-.449.44-.555.587-.154.638.672 1.284 1.338 1.903 2.026.148.409-.414.654-.61.95-.535.54-1.038 1.113-1.598 1.626-.079.026-.176.016-.237-.038zm-.52 1.256L2.41 9.57c-.384-.665-.773-1.327-1.15-1.996.158.045.452-.115.525.092.287.504.583 1.004.871 1.508 1.276.003 2.553-.012 3.828.03.636-1.089 1.286-2.167 1.929-3.25C7.782 4.868 7.16 3.781 6.529 2.7c-1.273-.011-2.546-.03-3.82-.027-.344.52-.65 1.065-.973 1.6-.205-.004-.602.056-.339-.227.352-.6.7-1.202 1.068-1.792 1.434.007 2.869.007 4.303.037.699 1.223 1.429 2.429 2.106 3.664-.658 1.17-1.37 2.31-2.05 3.467-.049.167-.174.198-.332.172-1.062 0-2.127.003-3.187-.013zm.499-1.268c-.277-.457.437-.754.646-1.1.341-.355.68-.71 1.018-1.068h-5.2c-.194-.113-.216-.416 0-.504 1.698-.006 3.397.016 5.094-.022-.516-.585-1.086-1.123-1.587-1.723-.215-.431.45-.552.583-.151.627.668 1.267 1.325 1.883 2.005.26.364-.304.622-.48.887-.56.571-1.1 1.161-1.671 1.72a.27.27 0 01-.286-.043zM3.1 9.581l-.693-.012c-.383-.664-.777-1.322-1.149-1.992.159.035.454-.12.528.084l.87 1.51c1.275.005 2.55.007 3.825.013.632-1.07 1.29-2.126 1.893-3.213-.1-.338-.36-.656-.523-.984-.444-.76-.876-1.526-1.327-2.28-1.277-.032-2.555-.024-3.832-.033-.326.524-.612 1.083-.966 1.582-.086-.029-.542.096-.417-.074l1.14-1.915c1.443.006 2.886-.012 4.328.026.7 1.225 1.415 2.44 2.116 3.665-.723 1.216-1.454 2.426-2.17 3.646C5.517 9.6 4.306 9.596 3.1 9.581zm.69-1.283c-.271-.365.313-.644.493-.918l1.176-1.223c-1.747-.013-3.494-.001-5.24-.045-.229-.145-.079-.553.187-.472 1.653-.003 3.307.009 4.96-.012-.517-.576-1.061-1.127-1.58-1.702-.252-.479.465-.574.61-.144.625.677 1.285 1.323 1.883 2.023.14.393-.407.624-.593.914-.526.539-1.032 1.099-1.578 1.619a.236.236 0 01-.318-.04z" />
    <g strokeWidth=".193">
      <path d="M2.356 12.844q-.02.032-.047.037h-.057q-.026.005-.042.037-.156.052-.465.13-.052.037-.182.058-.126.026-.183.067-.1.006-.193.006-.12 0-.157-.084-.188-.041-.162-.36.042-.501.23-1.149.183-.564.36-1.123-.026-.02-.026-.052 0-.047.047-.1l.042-.135q.02-.073.104-.1.047 0 .136.1.01.01.047.036-.02.11-.104.324-.079.214-.094.335.01.026-.016.041v.006l-.01.005q-.084.068-.11.235-.021.136-.047.277l-.032.026q-.052.136-.114.428-.058.293-.115.434-.016.12-.042.355-.016.183.073.271.23-.026.705-.167.454-.135.705-.162l.11.084q-.225.136-.36.141z" />
      <path d="M3.805 12.54q-.036.015-.068.067-.042.079-.052.09-.063.072-.225.192-.161.188-.433.188-.073 0-.146-.02-.173-.11-.193-.382.026-.136.114-.318.079-.147.152-.298.026-.026.115-.141.062-.089.136-.12.073-.1.203-.115.047.016.162-.078.021-.021.073-.053.141 0 .204.032.146.13.146.381 0 .13-.036.266-.042.105-.152.308zm0-.685q-.01-.11-.083-.156l-.168.057.042.063-.01.151q-.01.089-.063.136-.026.01-.047.01-.057 0-.068-.146v-.015q-.052.015-.12.088-.083.084-.12.105-.162.271-.178.318-.083.183-.067.35.03.058.088.068.543-.1.789-.794 0-.282.005-.235zm1.415.258q-.02.062-.042.094-.015.03-.02.067l-.016.042q0 .01-.01.042-.11.235-.163.48-.052.095-.068.23-.031.016-.031.058 0 .057-.016.078-.172.622-.24.815-.193.512-.433.694-.141.105-.256.105-.042 0-.084-.016l-.12-.12q.277.021.366-.162.104-.094.177-.24.293-.616.408-1.233-.152.079-.293.058-.12-.193-.12-.413 0-.198.1-.454.03-.073.203-.433.031-.053.047-.152.104-.026.157-.209.015.021-.01.037l-.1-.032q.162 0 .183-.005.041-.02.125-.052.246-.032.282.14.021.095.021.251v.251q-.037.031-.047.078zm-.152-.48l-.01-.011q0-.032-.02-.032-.152.084-.173.204-.115.073-.261.386-.141.314-.141.538 0 .09.02.173.298-.12.377-.476.005-.073.036-.146.021-.052.063-.136l.073-.13q0-.026-.068-.058.104-.047.104-.135v-.178zm1.182-.849l-.016.01q-.01.011-.02.053-.251.021-.267-.12 0-.084.057-.104.027-.006.126 0 .031 0 .068-.016.005.016.041.037.042.015.047.057.006.042-.036.084zm-.031 2.006q-.047.078-.157.224-.068.042-.146.084-.079.042-.152.037-.094-.006-.209-.157-.01-.094-.01-.188 0-.413.214-1.133.042-.12.141-.345.031-.037.084-.037.052 0 .099.037.047.037.047.084 0 .026-.016.047-.13.214-.23.5l-.062.335q-.079.45-.068.59.01.032.052.084.02.005.057-.031.042-.042.063-.047.052-.037.178-.168.099-.11.188-.151l.12-.141q-.094.313-.193.376zm1.89-.78q-.01.064-.063.34-.047.21-.047.34 0 .23.12.402-.136.047-.225-.031-.099-.173-.099-.413 0-.151.047-.381l.073-.366-.005-.01q-.204.157-.45.527-.27.402-.422.543-.115.053-.193.021-.094-.073-.047-.23.026-.125.162-.595.099-.37.125-.606.036-.047.089-.047.052 0 .094.058.047.052.036.11-.078.308-.224.924.02-.058.104-.146.25-.35.345-.465.214-.25.433-.387.068 0 .12.047.053.047.053.136 0 .037-.016.115-.01.078-.01.115z" />
    </g>
  </svg>
);

let customStyles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(78, 34, 255, 1)",
    zIndex: 10
  },
  content: {
    width: "75vmin",
    height: "75vmin",
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    padding: "0 0 0 0",
    borderRadius: "0",
    border: "none",
    transform: "translate(-50%, -50%)",
    background: "url(static/img/tile-background.jpg) repeat",
    backgroundSize: "auto 50vmin",
    zIndex: 10
  }
};
Modal.setAppElement("#__next");

const NavLink = ({ href, label, description, path, key, disabled, onClick, active, ...props }) => (
  <li className={classNames(/*path == href ||*/ active ? "menu-active" : "menu-inactive", "menu-item", disabled && "menu-disabled")} key={key}>
    <a className={classNames(path == href ? "menu-active" : "menu-inactive", "menu-link")} href={href} onClick={onClick}>
      {typeof label == "function" ? label(props) : label}
      <div className={"desc"}> {typeof description == "function" ? description(props) : description}</div>
    </a>
    <style jsx global>{`
      li.menu-active {
        border: 1px solid #00000040;
      }

      li.menu-inactive {
        border: 1px solid #00000000;
      }
      li.menu-inactive {
      }

      li.menu-disabled {
        display: none;
      }
      li.menu-item {
        position: relative;
        transition: width 1s;
        text-align: left;

        width: 48px;
        height: 48px;
        max-width: 48px;
        max-height: 51px;

        display: flex;
        flex-flow: column nowrap;
        transition: width 1s cubic-bezier(0.165, 0.84, 0.44, 1), max-width 1s cubic-bezier(0.165, 0.84, 0.44, 1), height 1s cubic-bezier(0.165, 0.84, 0.44, 1),
          max-height 1s cubic-bezier(0.165, 0.84, 0.44, 1);
      }
      li.menu-item:hover,
      li.menu-active {
        width: 100px;
        height: 100px;
        max-width: 100px;
        max-height: 100px;
      }
      li.menu-item > a > span {
        font-family: Fixed;
        font-size: 40px;
        vertical-align: top;
      }
      li.menu-item > a {
        position: absolute;
        margin: 8px 0px 1px 2px;
      }
      li.menu-item:hover > a,
      li.menu-active > a {
        width: 100px;
      }
      li.menu-item:hover > a > span,
      li.menu-active > a > span {
        width: 100px;
      }
      li.menu-item > a > div.desc {
        position: absolute;
        top: 48px;
        font-size: 15px;
      }
      li.menu-item {
        background-color: rgba(138, 0, 16, 0.8);
        display: flex;
        justify-content: flex-start;
        align-items: flex-start;
        padding: 0 0 0 0;
        margin: 2px 4px 2px 4px;
        overflow: hidden;
      }
      li.menu-item > a {
        font-size: 3em;
        color: white;
        text-decoration: none;
      }
      li.menu-item {
        transition: width 1s;
      }
      a:hover > span {
        filter: drop-shadow(0px 0px 4px #ffffffff);
      }
    `}</style>
  </li>
);

const prng = Alea.singleton(Date.now());

const randomColor = () => new HSLA(Util.randInt(0, 359), Util.randInt(50, 99), Util.randInt(10, 50), 1);

const randomGradient = () => {
  let hue = 0 - Math.abs(prng.double()) * 200;
  if(hue < 0) hue += 360;
  let baseColor = new HSLA(Math.floor(hue), Math.floor(prng.double() * 50 + 50), Math.floor(prng.double() * 25 + 60), 0.8);

  //console.log("baseColor ", baseColor.toString());
  let colors = [new HSLA(baseColor.h, baseColor.s, baseColor.l, baseColor.a), new HSLA(baseColor.h, baseColor.s, baseColor.l, baseColor.a)];
  colors[0].l = colors[0].l / 2;
  colors[1].l = 100 - (100 - colors[1].l) / 2;
  /*  console.log(
    "colors ",
    colors.map(c => c.toString())
  );*/

  return colors;
};
const setLanguage = (store, lang, setOpen) => {
  if(store && store.user && store.user.lang) {
    set(store.user, "lang", lang);
  }
  console.log("setLanguage", store, lang);

  Timer.once(1000, () => setOpen(false));
};

const Nav = inject(
  "rootStore",
  "i18nStore"
)(
  observer(
    withRouter(({ rootStore, i18nStore, loading, ...props }) => {
      const [loginIsOpen, setLoginOpen] = React.useState(false);
      const [languageIsOpen, setLanguageOpen] = React.useState(false);

      const [color, setColor] = React.useState(randomGradient());
      const angle = ((color[0].h + color[0].s + color[0].l) % 360) - 180;
      customStyles.overlay.background = `linear-gradient(${Math.floor(angle)}deg, ${color[0].toString()} 0%, ${color[1].toString()} 100%)`;
      //console.log("Nav.render", { angle });

      const language = i18nStore.user.lang;
//      console.log("i18nStore: ", i18nStore);

      var SiteMap = [
        {
          href: "/",
          name: "home",
          label: (
            <span>
              <Translate value="nav.home_name" />
            </span>
          ),
          description: <Translate value="nav.home_description" />
        },
        {
          href: "/test",
          name: "text",
          label: (
            <span>
              <Translate value="nav.gallery_name" />
            </span>
          ),
          description: <Translate value="nav.gallery_description" />
        },
        {
          href: "/show",
          name: "show",
          label: (
            <span>
              <Translate value="nav.show_name" />
            </span>
          ),
          description: <Translate value="nav.show_description" />
        },
        {
          href: "/new",
          name: "new",
          label: (
            <span>
              <Translate value="nav.new_name" />
            </span>
          ),
          description: <Translate value="nav.new_description" />
        },
        {
          href: "#",
          name: "logout",
          disabled: true,
          label: () => (
            <span>
              <Translate value="nav.logout_name" />
            </span>
          ),
          description: () => (
            <React.Fragment>
              <Translate value="nav.logout_description" />: {rootStore.state.username}
            </React.Fragment>
          )
        },
        {
          href: "#",
          name: "login",
          label: () => (
            <span>
              {" "}
              <Translate value="nav.login_name" />{" "}
            </span>
          ),
          description: <Translate value="nav.login_description" />
        },
        {
          href: "#",
          name: "lang",
          label: () => (
            <span>
              <Translate value="nav.lang_name" />
            </span>
          ),
          description: <Translate value="nav.lang_description" />
        }
      ];
      if(global.window) {
        window.SiteMap = SiteMap;
      }

      let entry = Util.find(SiteMap, "lang", "name");
      //     console.log("SiteMap: ", SiteMap);
      entry.active = languageIsOpen;

      entry = Util.find(SiteMap, "login", "name");
      entry.active = loginIsOpen;

      entry = Util.find(SiteMap, "new", "name");
      entry.disabled = !rootStore.authenticated;

      entry = Util.find(SiteMap, "logout", "name");
      entry.disabled = !rootStore.authenticated;

      entry = Util.find(SiteMap, "login", "name");
      entry.disabled = rootStore.authenticated;

      return (
        <div className="menu">
          <Modal
            isOpen={loginIsOpen}
            onAfterOpen={() => {}}
            onRequestClose={() => setLoginOpen(false)}
            style={{
              overlay: customStyles.overlay,
              content: { ...customStyles.content, maxWidth: "320px", maxHeight: "320px" }
            }}
            contentLabel="Login Modal"
            closeTimeoutMS={1000}
          >
            <LoginForm
              show={true}
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                boxShadow: "1px 1px 2px 2px rgba(0, 0, 0, 1)"
              }}
              loading={loading}
              onLogin={(user, pass) => {
                rootStore.doLogin(user, pass, res => {
                  if(res.success)
                    Timer.once(1333, () => {
                      setLoginOpen(false);
                    });
                });
              }}
            />
          </Modal>
          <Modal isOpen={languageIsOpen} onAfterOpen={() => {}} onRequestClose={() => setLanguageOpen(false)} style={customStyles} contentLabel="Language Modal" closeTimeoutMS={1000}>
            <div className={"flagbox"}>
              <div className={"flaglist"}>
                <div onClick={() => setLanguage(i18nStore, "de", setLanguageOpen)}>
                  <ReactCountryFlag code={"de"} svg className={"country-flag"} styleProps={{ width: "24vmin", height: "18.12vmin", margin: "10px 10px" }} />
                </div>
                <div onClick={() => setLanguage(i18nStore, "fr", setLanguageOpen)}>
                  <ReactCountryFlag code={"fr"} svg className={"country-flag"} styleProps={{ width: "24vmin", height: "18.12vmin", margin: "10px 10px" }} />
                </div>
                <div onClick={() => setLanguage(i18nStore, "en", setLanguageOpen)}>
                  <ReactCountryFlag code={"gb"} svg className={"country-flag"} styleProps={{ width: "24vmin", height: "18.12vmin", margin: "10px 10px" }} />
                </div>
              </div>
            </div>
          </Modal>
          <ul>
            {SiteMap.map(link => {
              link.key = `nav-link-${typeof link.href == "string" ? link.href : ""}-${typeof link.name == "string" ? link.name : ""}`;
              return link;
            }).map(item => {
              //     console.log("item.name: ", item.name);

              if(item.name == "login") {
                if(rootStore.authenticated) item.label = <span>Logout</span>;
              }

              if(item.disabled) return undefined;
              return (
                <NavLink
                  key={item.key}
                  {...{ ...props, ...item, path: props.router.asPath }}
                  onClick={
                    item.name.startsWith("log")
                      ? () => {
                          console.log("click login");
                          if(item.name == "login") {
                            if(!loginIsOpen) {
                              setColor(randomGradient());
                              setLoginOpen(!loginIsOpen);
                            }
                          } else if(item.name == "logout") {
                            rootStore.doLogout();
                          }
                        }
                      : item.name == "lang"
                      ? () => {
                          console.log("click language");
                          if(!languageIsOpen) {
                            setColor(randomGradient());
                            setLanguageOpen(!languageIsOpen);
                          }
                        }
                      : undefined
                  }
                />
              );
            })}
          </ul>

          <style jsx global>{`
            :global(body) {
              margin: 0;
              box-sizing: content-box;
              font-family: -apple-system, BlinkMacSystemFont, Avenir Next, Avenir, Helvetica, sans-serif;
            }
            .flagbox {
              width: 100%;
              height: 100%;

              box-shadow: 1px 1px 2px 2px rgba(0, 0, 0, 1);
              overflow: hidden;
            }
            .country-flag {
              opacity: 1;
              border: 2px solid rgba(0, 0, 0, 0);
              transition: transform 800ms, opacity 800ms;

              transform: scale3d(0.5, 0.5, 1) rotateY(-180deg);
            }
            .country-flag:hover {
              opacity: 1;

              border: 2px solid rgba(0, 0, 0, 0);
              transform: scale3d(1, 1, 1) rotateY(0);
            }
            div < .country-flag:hover {
              transform: rotateZ(360deg);
            }

            .flaglist {
              position: relative;
              top: 50%;
              transform: translateY(-50%);
              display: flex;
              flex-flow: row wrap;
              justify-content: space-around;
              align-items: center;
              padding: auto 0;
            }
            ul.menu {
              font-family: Fixed;
            }
            .menu {
              position: absolute;
              top: 0;
              right: 0;
              z-index: 12;
              text-align: center;
              display: înline-block;
              color: white;
              float: right;
            }
            ul {
              display: flex;
              justify-content: flex-end;
              margin-block-start: 0;
              margin-block-end: 0;
            }
            .menu > ul {
              padding: 4px 4px;
            }
            .ReactModal__Overlay {
              transition: transform 1000ms linear;
              transform: perspective(300px) translate3d(50vw, -50vh, 0) rotateX(-45deg) rotateY(-45deg) rotateZ(90deg) scale3d(0.02, 0.02, 1);
            }
            .ReactModal__Overlay--after-open {
              transform: perspective(300px) rotate3d(0, 0, 1, 0deg) scale3d(1, 1, 1);
            }
            .ReactModal__Overlay--before-close {
              transform: perspective(300px) translate3d(-50vw, 50vh, 0) rotateX(45deg) rotateY(45deg) rotateZ(-90deg) scale3d(0.02, 0.02, 1);
            }
          `}</style>
        </div>
      );
    })
  )
);

export default Nav;
