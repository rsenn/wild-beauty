import { useRouter } from "next/router";
import { useEffect } from "react";

export default function MyLink({ href, title, prefetch }) {
  if(href != "#") {
    const router = useRouter();
    const style = {
      marginRight: 10,
      color: router.pathname === href ? "red" : "black"
    };

    useEffect(() => {
      if(prefetch) router.prefetch(href);
    });

    const handleClick = e => {
      e.preventDefault();
      console.log(`Link ${href} clicked`);
      router.push(href);
     // window.location.href = href;
    };

    return (
      <a href={href} onClick={handleClick}>
        {title}
        <style jsx>{`
        a {
        margin: 10px;
      `}</style>
      </a>
    );
  }

  return title;
}
