import { h, render } from "preact";
import { Toaster } from "react-hot-toast";
import Tools from "./components/tools";
import styles from "bundle-text:./app.css";

const initApp = () => {
    const appContainer = document.createElement("div");
    appContainer.id = "annotator-app-container";
    document.body.appendChild(appContainer);

    const toolsContainer = document.createElement("div");
    toolsContainer.id = "annotator-tools-container";
    document.body.appendChild(toolsContainer);

    toolsContainer.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.innerHTML = styles;
    toolsContainer.shadowRoot.appendChild(style);

    render(<Tools />, toolsContainer.shadowRoot);
    render(
        <Toaster
            containerStyle={{ position: "fixed" }}
        />,
        appContainer
    );
};

export { initApp };
