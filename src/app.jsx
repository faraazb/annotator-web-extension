import { h, render } from "preact";
// import ComboboxExample from "./components/combobox/example";
import Tools from "./components/tools";

const initApp = () => {
    const appContainer = document.createElement("div");
    // TODO probably randommize/mangle classes and IDs?
    appContainer.id = "annotator-app-container";
    document.body.appendChild(appContainer);

    const toolsContainer = document.createElement("div");
    toolsContainer.id = "annotator-tools-container";
    document.body.appendChild(toolsContainer);

    render(<Tools />, toolsContainer);
    // render(<ComboboxExample />, appContainer);
};

export { initApp };
