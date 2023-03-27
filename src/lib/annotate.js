import Overlay from "../lib/overlay";
import { createPopper } from "@popperjs/core";
import { render } from "preact";
import AnnotatorInput from "../components/AnnotatorInput/AnnotatorInput";
import { createPopper } from "@popperjs/core";
import { render } from "preact";
import AnnotatorInput from "../components/AnnotatorInput/AnnotatorInput";

let overlay = null;
let inspecting = false;
const mousePos = { x: 0, y: 0 };

const canIgnore = (target) => {
    const annotateParent = target.closest('[id^="annotator"]');

    if (annotateParent) {
        return true;
    } else {
        false;
    }
};

const getInspectName = (element) => {
    return element.tagName.toLowerCase();
};

export const startInspectorMode = () => {
    inspecting = true;
    if (!overlay) {
        overlay = new Overlay();
    }

    const element = document.elementFromPoint(mousePos.x, mousePos.y);

    if (element) {
        // highlight the initial point.
        overlay.inspect([element], getInspectName(element));
    }

    window.addEventListener("pointerover", handleElementPointerOver, true);
    window.addEventListener("click", handleElementClick, true);
};

export const exitInspectorMode = () => {
    inspecting = false;
    if (overlay) {
        overlay.remove();
        overlay = null;
    }
    window.removeEventListener("pointerover", handleElementPointerOver, true);
    window.removeEventListener("click", handleElementClick, true);
};

const handleElementPointerOver = (e) => {
    const target = e.target;
    if (!target || !overlay) return;

    if (canIgnore(target)) {
        return;
    }

    overlay.inspect([target], getInspectName(target));
};

const handleElementClick = (e) => {
    e.preventDefault();

    const target = e.target;
    if (!target) return;

    if (canIgnore(target)) {
        return;
    }

    if (localStorage.getItem("annotating") === "true") {
        removeAnnotatorInput();
        return;
    }

    let annotatorInput = document.createElement("div");
    annotatorInput.id = "annotator-input";
    render(<AnnotatorInput element={target} />, annotatorInput);

    let app_container = document.getElementById("annotator-app-container");
    app_container.appendChild(annotatorInput);

    createPopper(target, annotatorInput, {
        modifiers: [
            {
                name: "offset",
                options: {
                    offset: [0, 8],
                }
            }
        ]
    });

    if (!localStorage.getItem("annotating")) {
        localStorage.setItem("annotating", "true");
        window.removeEventListener(
            "pointerover",
            handleElementPointerOver,
            true
        );
    }
};

export const removeAnnotatorInput = () => {
    localStorage.removeItem("annotating");
    window.addEventListener("pointerover", handleElementPointerOver, true);
    document.getElementById("annotator-input").remove();
};

const handleEscape = (e) => {
    if (e.key?.toLowerCase() === "escape") {
        e.preventDefault();
        removeAnnotatorInput();
        exitInspectorMode();
    }
};

window.addEventListener("keydown", handleEscape);

window.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

window.addEventListener("beforeunload", function() {
    this.localStorage.removeItem("annotating");
});
window.addEventListener("beforeunload", function() {
    this.localStorage.removeItem("annotating");
});
