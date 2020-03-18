import React from "react";
import { inject, observer } from "mobx-react";
import { useTransition } from "react-spring";
import { TransitionGroup, CSSTransition } from "react-transition-group";
import Util from "../../lib/util.js";

const duration = 300;

const defaultStyle = {
  transition: `opacity ${duration}ms ease-in-out`,
  opacity: 0
};

const transitionStyles = {
  entering: { opacity: 1 },
  entered: { opacity: 1 },
  exiting: { opacity: 0 },
  exited: { opacity: 0 }
};

export const ToastsContainer = inject("rootStore")(
  observer(({ rootStore, onClick, ...props }) => {
    /*
    const transitions = useTransition(rootStore.toasts, t => t.deadline, {
      from: { position: "absolute", opacity: 0 },
      enter: { opacity: 1 },
      leave: { opacity: 0 }
    });*/
    let toasts = rootStore.toasts.length > 0 ? Util.range(rootStore.toasts.length - 1, 0).map(i => rootStore.toasts[i]) : [];

    console.log("toasts: ", toasts);
    return (
      <React.Fragment>
        <div className={"toasts-container"} onClick={onClick}>
          <TransitionGroup component='div'>
            {toasts.map((toast, key) => (
              <CSSTransition timeout={500} className='toast-move' key={toast.deadline}>
                <div>
                  <div key={toast.deadline} className={"toast-item toast-layout center-flex"}>
                    {toast.title ? <h4 className={"toast-title"}>{toast.title}</h4> : undefined}
                    <span className={"toast-message"}>{toast.message}</span>

                    <button className={"toast-button"} href='#' data-deadline={toast.deadline}>
                      &#x274c;
                    </button>
                  </div>
                </div>
              </CSSTransition>
            ))}
          </TransitionGroup>
        </div>
        <style jsx global>{`
          .toast-button {
            color: hsl(0, 100%, 95%);
            -webkit-filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 1));
            filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 1));
            text-decoration: none;
            background: none;
            outline: none;
            border: none;
          }
          .toast-button:hover {
            color: white;
            text-decoration: underline;
            text-decoration: none;
          }
          .toasts-container {
            position: fixed;
            bottom: 0;
            right: 0;
            padding: 30px;
            z-index: 1000000;
          }
          .toast-title {
            margin: 0px;
            padding: 0px;
          }
          .toast-item {
            margin: auto 0;
            font-size: 14px;
            line-height: 1em;
          }
          .toast-item {
            margin: 10px;
            padding: 10px 10px;
            border: 0px solid red;
            border-radius: 5px;
            background-color: hsl(0, 100%, 55%);
            color: white;
            min-width: 250px;
            height: 42px;
            text-align: left;
            line-height: 100%;
            vertical-align: middle;
          }
          .toast-layout {
            display: flex;
            justify-content: space-between;
          }

          .toast-container {
            transform: translateY(0px);
          }
          .toast-move-enter-done {
            transition: transform 500ms ease-out, opacity 500ms ease-out;
            transform: translateY(0);
            opacity: 1;
          }
          .toast-move-enter {
            transition: transform 500ms ease-out, opacity 500ms ease-out;
            transform: translateY(50px);
            opacity: 0;
          }

          .toasts-container {
            pointer-events: none;
          }
        `}</style>
      </React.Fragment>
    );
  })
);

export default ToastsContainer;
