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
    const annotateParent = target.closest('[data-annotator-ui="true"]');

    if (annotateParent) {
        return true;
    } else {
        return false;
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

    // if (!(target instanceof HTMLElement)) {
    //     return false;
    // }

    if (canIgnore(target)) {
        return;
    }

    overlay.inspect([target], getInspectName(target));
};

const handleElementClick = (e) => {
    e.preventDefault();
    const target = e.target;
    // even the tools menu gets ignored through here
    if (target.shadowRoot) {
        return;
    }
    renderLabel(target);
};

const handleShadowElementClick = (target) => {
    if (!(target instanceof HTMLElement)) {
        return;
    }
    renderLabel(target);
};

const renderLabel = (target, annotatorInputprops = {}) => {
    const { onInputSubmit, onInputCancel, onDelete, showAnnotateSimilar, showBoundingBox } = annotatorInputprops;

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

    render(
        <AnnotatorInput
            element={target}
            onInputSubmit={onInputSubmit}
            onInputCancel={onInputCancel}
            onDelete={onDelete}
            showAnnotateSimilar={showAnnotateSimilar}
            showBoundingBox={showBoundingBox}
        />,
        annotatorInput
    );

    let app_container = document.getElementById("annotator-app-container");
    app_container.appendChild(annotatorInput);

    let paddingTop = parseInt(window.getComputedStyle(target).paddingTop, 10) || 0;
    let paddingBottom = parseInt(window.getComputedStyle(target).paddingBottom, 10) || 0;

    createPopper(target, annotatorInput, {
        modifiers: [
            {
                name: "offset",
                options: {
                    offset: ({ placement }) => {
                        if (placement === "top") {
                            return [0, -paddingTop + 16];
                        }
                        if (placement === "bottom") {
                            return [0, -paddingBottom + 16];
                        } else {
                            return [0, 16];
                        }
                    },
                },
            },
            {
                name: "flip",
                options: {
                    fallbackPlacements: ["left", "right"],
                },
            },
        ],
    });

    if (!localStorage.getItem("annotating")) {
        localStorage.setItem("annotating", "true");
        window.removeEventListener("pointerover", handleElementPointerOver, true);
    }
};

export const removeAnnotatorInput = () => {
    localStorage.removeItem("annotating");
    window.addEventListener("pointerover", handleElementPointerOver, true);
    // BUG This gets called
    document.getElementById("annotator-input").remove();
};

// const handleEscape = (e) => {
//     if (e.key?.toLowerCase() === "escape") {
//         e.preventDefault();
//         removeAnnotatorInput();
//         exitInspectorMode();
//     }
// };
//
// window.addEventListener("keydown", handleEscape);

window.addEventListener("mousemove", (e) => {
    mousePos.x = e.clientX;
    mousePos.y = e.clientY;
});

window.addEventListener("beforeunload", function() {
    this.localStorage.removeItem("annotating");
    this.localStorage.removeItem("items")
});

export { handleElementPointerOver, handleElementClick, handleShadowElementClick, renderLabel };
