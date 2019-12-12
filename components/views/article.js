import { WrapInAspectBox, SizedAspectRatioBox } from "../simple/aspectBox.js";

export const Article = ({ children, title /* = "Untitled"*/, text, ...props }) => {
  console.log("Rendering Article: ", { text, ...props });
  return (
    <SizedAspectRatioBox width={"20vw"} className={"article-box"}>
      {title ? <h4 className={"article-title"}>{title}</h4> : undefined}
      <div className={'article-content'}>
      {text ? <p className={"article-text"}>{text} </p> : undefined}
      {children}
      &nbsp;
      </div>

      <style jsx global>{`
        p.article-text {
          margin: 0px;
          position: relative;
          font-size: 0.8em;
          padding: 8px 2px 2px 8px;
          font-family: "Century Gothic", Arial, sans;
        }
        h4.article-title {
          margin: 0px;
          position: relative;
          top: 0px;
          background: black;
          color: white;
          font-family: "Candara Bold", Calibri, Segoe, "Segoe UI", Optima, Arial, sans-serif;
          font-size: 20px;
          font-style: normal;
          font-variant: normal;
          font-weight: 900;
          padding: 2px 0px 4px 10px;
          text-align: left;
        }
        div.article-box-size {
          margin: 4px;
/*          border: 1px inset rgba(192, 192, 192, 0.3);
*/        }
        div.article-box {
          position: relative;
          height: 20vw;
          display: flex;
          flex-flow: column nowrap;
          justify-content: stretch;
          align-items: stretch;
                    border-top: 2px solid rgba(0, 0, 0, 0.4);

        }
        div.article-content {
          height: 100%;
          border-bottom: 2px solid rgba(0, 0, 0, 0.4);
          border-left: 2px solid rgba(0, 0, 0, 0.4);
          border-right: 2px solid rgba(0, 0, 0, 0.4);

          background-color: rgba(160, 160, 160, 0.2);
        }
        .article-box .aspect-ratio-box-inside {
          display: inline-block;
        }
        .article-box-size {
        }
        .article-box-size:hover {
          background-color: rgba(120, 120, 120, 0.3);
          box-shadow: 0px 0px 4px 0px rgba(0, 0, 0, 0.6);
        }
      `}</style>
    </SizedAspectRatioBox>
  );
};

export default Article;
