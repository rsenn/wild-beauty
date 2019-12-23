import { Translate } from "react-i18nify-mobx";

export const SiteMap = [
  {
    href: "/",
    name: "home",
    label: () => (
      <span>
        <Translate value="nav.home_name" />
      </span>
    ),
    description: () => <Translate value="nav.home_description" />
  },
  /*{
    href: "/test",
    name: "text",
    label: () => (
      <span>
        <Translate value="nav.gallery_name" />
      </span>
    ),
    description: () => <Translate value="nav.gallery_description" />
  },*/
  {
    href: "/show",
    name: "show",
    label: () => (
      <span>
        <Translate value="nav.show_name" />
      </span>
    ),
    description: () => <Translate value="nav.show_description" />
  },
  {
    href: "/new",
    name: "new",
    label: () => (
      <span>
        <Translate value="nav.new_name" />
      </span>
    ),
    description: () => <Translate value="nav.new_description" />
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
    description: props => (
      <React.Fragment>
        <Translate value="nav.logout_description" />: {props.rootStore.auth.user && props.rootStore.auth.user.username}
      </React.Fragment>
    )
  },
  {
    href: "#",
    name: "login",
    label: () => (
      <span>
        <Translate value="nav.login_name" />
      </span>
    ),
    description: () => <Translate value="nav.login_description" />
  },
  {
    href: "#",
    name: "lang",
    label: () => (
      <span>
        <Translate value="nav.lang_name" />
      </span>
    ),
    description: () => <Translate value="nav.lang_description" />
  }
];

export default SiteMap;
