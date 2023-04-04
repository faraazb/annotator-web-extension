import { h, render } from "preact";
import { Toaster } from "react-hot-toast";
import Tools from "./components/tools";
import styles from "bundle-text:./app.css";
import {
    handleElementPointerOver,
    handleShadowElementClick,
} from "./lib/annotate";
import Board from "./components/board";

function shadowElementClick(event) {
    event.preventDefault();
    event.stopPropagation();
    handleShadowElementClick(event.target);
}

const prepareShadowElements = (elements) => {
    elements.forEach((element) => {
        element.addEventListener(
            "pointerover",
            handleElementPointerOver,
            false
        );
        element.addEventListener("click", shadowElementClick, false);
    });
};

const prepareElements = (elements) => {
    elements.forEach((element) => {
        const computedStyle = window.getComputedStyle(element);
        element.style.transition = "none";
        if (computedStyle.getPropertyValue("position") === "sticky") {
            element.classList.add(
                "annotator-screenshot-fix",
                "annotator-fix--sticky"
            );
            // element.style.position = "relative";
            // element.style.inset = "auto";
        } else if (computedStyle.getPropertyValue("position") === "fixed") {
            element.classList.add(
                "annotator-screenshot-fix",
                "annotator-fix--fixed"
            );
            // element.style.position = "absolute";
        }
        const shadowRoot = element.shadowRoot;
        if (shadowRoot) {
            prepareShadowElements([shadowRoot]);
            const style = document.createElement("style");
            style.innerHTML = `
                .annotator-fix--sticky {
                    position: relative !important;
                    inset: auto !important;
                }
                
                .annotator-fix--fixed {
                    position: absolute !important;
                }`;
            shadowRoot.appendChild(style);
            const shadowElements = shadowRoot.querySelectorAll("*");
            prepareShadowElements(shadowElements);
            prepareElements(shadowElements);
        }
    });
};

const prepareDOM = () => {
    const elements = document.querySelectorAll("*");
    prepareElements(elements);
};

const initApp = () => {
    prepareDOM();
    const appContainer = document.createElement("div");
    appContainer.dataset.annotatorUi = true;
    appContainer.id = "annotator-app-container";
    document.body.appendChild(appContainer);

    const boardContainer = document.createElement("div");
    boardContainer.dataset.annotatorUi = true;
    boardContainer.id = "annotator-board-container";
    document.body.appendChild(boardContainer);

    const boardElContainer = document.createElement("div");
    boardElContainer.id = "annotator-board-elements-container";
    document.body.appendChild(boardElContainer);

    const toolsContainer = document.createElement("div");
    toolsContainer.dataset.annotatorUi = true;
    toolsContainer.id = "annotator-tools-container";
    document.body.appendChild(toolsContainer);

    toolsContainer.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.innerHTML = styles;
    toolsContainer.shadowRoot.appendChild(style);

    render(<Tools />, toolsContainer.shadowRoot);
    render(<Toaster containerStyle={{ position: "fixed" }} />, appContainer);
    render(<Board />, boardContainer);
};

export { initApp };
