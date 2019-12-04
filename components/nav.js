import React from "react";
import Link from "next/link";

const links = [
  // { href: '/', label: 'Home' },
  { href: "/test", label: "Gallery" },
  { href: "/panes", label: "Panes" }
].map(link => {
  link.key = `nav-link-${link.href}-${link.label}`;
  return link;
});

const Nav = () => (
  <div className="menu">
    <ul>
      <li>
        <Link href="/">
          <a>Home</a>
        </Link>
      </li>
      {links.map(({ key, href, label }) => (
        <li key={key}>
          <a href={href}>{label}</a>
        </li>
      ))}
    </ul>

    <style jsx>{`
      :global(body) {
        margin: 0;
        box-sizing: content-box;
        font-family: -apple-system, BlinkMacSystemFont, Avenir Next, Avenir, Helvetica, sans-serif;
      }
      .menu {
        text-align: center;
        display: inline-block;
      }
      ul {
        display: flex;
        justify-content: space-around;
      }
      .menu > ul {
        padding: 4px 16px;
      }
      li {
        background-color: #dfdfdf80;

        display: flex;
        padding: 6px 8px;
      }
      a {
        color: #067df7;
        text-decoration: none;
        font-size: 13px;
      }
    `}</style>
  </div>
);

export default Nav;
