import { useEffect, useRef } from "preact/hooks";
import Konva from "konva";
import { getStore, tools, useStore } from "../../store";
import { render } from "preact";
import { exitInspectorMode, renderLabel, startInspectorMode } from "../../lib/annotate";
// import Combobox, { LabelCombobox } from "../combobox";
// import Rectangle from "../../canvas/rectangle";

let toolId = null;

function isFixedOrSticky(node) {
    while (node && node.nodeName.toLowerCase() !== "body") {
        let position = window.getComputedStyle(node).getPropertyValue("position").toLowerCase();
        if (position === "fixed" || position === "sticky") {
            return { result: false, node };
        }
        node = node.parentNode;
    }
    return { result: true, node };
}

const Board = () => {
    // const [labels, setLabels] = useStore.labels();
    const [selectedTool] = useStore.selectedTool();
    // const [nodes, setNodes] = useStore.nodes();
    // const canvasContainer = useRef();

    useEffect(() => {
        // console.log("Board rendered");
        const [drawRectangle] = initCanvas();
    }, []);

    useEffect(() => {
        // console.log("Tool changed");
        toolId = selectedTool;
        const markerrBoardContainer = document.getElementById("annotator-board-container");
        if (selectedTool === tools.ELEMENT_PICKER) {
            // disable pointer events on canvas container
            if (markerrBoardContainer) {
                markerrBoardContainer.style.pointerEvents = "none";
            }
            startInspectorMode();
            return;
        } else {
            exitInspectorMode();
            // theRoom.stop();
            // enable pointer events on canvas
            if (markerrBoardContainer) {
                markerrBoardContainer.style.pointerEvents = "auto";
            }
        }
        // canvasContainer.current.focus();
    }, [selectedTool]);

    return (
        <>
            <div id="markerr-canvas-container"></div>
        </>
    );
};

const removeAnnotatorInputIfPresent = () => {
    let annotatorInput = document.getElementById("annotator-input");
    if (annotatorInput) {
        localStorage.removeItem("annotating");
        annotatorInput.remove();
        return true;
    }
    return false;
};

const initCanvas = () => {
    // const [labels, setLabels] = getStore.labels();
    // const [toolId] = getStore.selectedTool();
    const [tool, setTool] = getStore.selectedTool();
    const scrollAdjustNodes = [];

    const markerrBoardContainer = document.getElementById("annotator-board-container");

    const body = document.body;
    const html = document.documentElement;
    let height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
    );
    let width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);

    // let width = document.documentElement.scrollWidth;
    // let height = document.documentElement.scrollHeight;

    let selectedShapes = [];

    // Set up the canvas and shapes
    let stage = new Konva.Stage({
        container: "markerr-canvas-container",
        width: width,
        height: height,
    });
    let layer = new Konva.Layer({ draggable: false });

    stage.add(layer);
    stage.draw();

    let transformer = new Konva.Transformer({ ignoreStroke: true });
    transformer.rotateEnabled(false);
    layer.add(transformer);

    const stageContainer = stage.container();
    stageContainer.tabIndex = 1;

    // document.addEventListener("scroll", (event) => {
    //     scrollAdjustNodes.forEach((node) => {
    //         const { x, y, top, left } = node.element.getBoundingClientRect();
    //         const { height } =
    //             node.markerrNodeLabelContainer.getBoundingClientRect();
    //         // console.log(y + window.scrollY);
    //         node.position({ x: x, y: y + window.scrollY });
    //         node.markerrNodeLabelContainer.style.top = `${top - height - 5}px`;
    //         // maybe apply the position related propeties of the
    //         // parent node that was sticky or fixed
    //         node.markerrNodeLabelContainer.style.position = "fixed";

    //         if (node.markerrSelectSimilarButton) {
    //         }
    //     });
    // });

    // draw a dotted rectangle preview
    let draftRectangle = new Konva.Rect({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        stroke: "red",
        dash: [2, 2],
    });
    draftRectangle.listening(false);
    layer.add(draftRectangle);

    // selection rectangle
    // let selectionRectangle = new Konva.Rect({
    //     fill: "rgba(113, 52, 205, 0.1)",
    //     stroke: "rgba(113, 52, 205)",
    //     strokeWidth: 1,
    //     visible: false,
    // });
    // layer.add(selectionRectangle);
    const destroyShape = (shape) => {
        // removeAnnotatorInputIfPresent();
        if (shape.markerrNodeLabelContainer) {
            shape.markerrNodeLabelContainer.remove();
        }
        shape.destroy();
    };

    // keyboard events - delete
    stageContainer.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            selectedShapes.forEach((shape) => {
                // if (shape.node) {
                //     shape.node.dataset.markerr = "deleted";
                // }
                // if (shape.markerrSelectSimilarButton) {
                //     shape.markerrSelectSimilarButton.remove();
                // }
                destroyShape(shape);
            });
            selectShapes([]);
        } else if (e.key === "v") {
            setTool(1);
        } else if (e.key === "r") {
            setTool(2);
        } else if (e.key === "p") {
            setTool(3);
        }
    });

    stage.draw();

    let dragStartPosition;
    let dragEndPosition;
    let mode = "";

    // these drag functions are probably tool specific
    function startDrag(position) {
        // console.log("Starting from", position)
        dragStartPosition = { x: position.x, y: position.y };
        dragEndPosition = { x: position.x, y: position.y };
    }

    function updateDrag(position) {
        // console.log("Updating to", position)
        dragEndPosition = { x: position.x, y: position.y };
        let rectPosition = reverse(dragStartPosition, dragEndPosition);
        draftRectangle.x(rectPosition.x1);
        draftRectangle.y(rectPosition.y1);
        draftRectangle.width(rectPosition.x2 - rectPosition.x1);
        draftRectangle.height(rectPosition.y2 - rectPosition.y1);
        draftRectangle.visible(true);

        stage.draw();
    }

    function selectElementsByClassName(className) {
        const elements = document.getElementsByClassName(className);
        if (elements.length > 0) {
            for (let element of elements) {
                if (element.dataset?.markerr !== "true") {
                    const { x, y, width, height } = element.getBoundingClientRect();
                    const rectangle = drawRectangle({
                        x: x + window.scrollX,
                        y: y + window.scrollY,
                        width,
                        height,
                        node: element,
                        focusLabel: false,
                    });
                }
            }
        }
    }

    function drawRectangle({ x, y, width, height, element, focusLabel = true, adjustOnScroll = false, ...rest }) {
        // console.log("Drawing");
        const newRect = new Konva.Rect({
            name: "rect",
            x: x,
            y: y,
            width: width,
            height: height,
            stroke: "red",
            strokeWidth: 3,
            // dash: [2, 2],
            listening: true,
            draggable: true,
            strokeScaleEnabled: false,
            rest,
        });

        newRect.markerrId = crypto.randomUUID();
        newRect.markerrLabel = "";

        // This container has all the ghost support divs for each of the canvas shapes
        const boardElContainer = document.getElementById("annotator-board-elements-container");

        // a ghost target div for the annotator input that moves along
        // with the canvas shape
        const rectDOMTarget = el(`div`, {
            style: `position: absolute;
                pointer-events: none;
                top: ${y}px; 
                left: ${x}px;
                height: ${height}px;
                width: ${width}px;
                z-index: 999999x;`,
        });

        let titlePopperInstance;

        // show annotator input when the ghost div is clicked
        // also pass functions to make changes to the canvas element
        rectDOMTarget.addEventListener("click", () => {
            if (toolId === tools.RECTANGLE) {
                renderLabel(rectDOMTarget, {
                    onInputSubmit: () => {
                        // titlePopperInstance = popperInstance;
                        // newRect.destroy();
                    },
                    onInputCancel: (inputValue) => {
                        if (inputValue.trim() === "") {
                            newRect.destroy();
                            rectDOMTarget.remove();
                        }
                    },
                    onDelete: () => {
                        selectShapes([]);
                        destroyShape(newRect);
                    },
                    showAnnotateSimilar: false,
                    showBoundingBox: false,
                });
            }
        });
        newRect.markerrNodeLabelContainer = rectDOMTarget;

        newRect.on("click", (_event) => {
            rectDOMTarget.click();
        });

        newRect.on("transformstart", (_event) => {
            removeAnnotatorInputIfPresent();
        });

        newRect.on("transformend", (_event) => {
            // newRect.y() + (newRect.height() * newRect.scaleY()) + 5
            rectDOMTarget.style.top = `${newRect.y()}px`;
            rectDOMTarget.style.left = `${newRect.x()}px`;
            rectDOMTarget.style.height = `${(newRect.height() * newRect.scaleY()).toString()}px`;
            rectDOMTarget.style.width = `${(newRect.width() * newRect.scaleX()).toString()}px`;
            const titleElId = rectDOMTarget.getAttribute("data-annotate-id");
            const titleEl = document.getElementById(titleElId);
            if (titleEl) {
                titleEl.style.width = `${(newRect.width() * newRect.scaleX()).toString()}px`;
            }

            // // disable select similar button when el annotation is moved
            // if (newRect.markerrSelectSimilarButton) {
            //     newRect.markerrSelectSimilarButton.remove();
            //     newRect.markerrSelectSimilarButton = undefined;
            // }

            // if (newRect.element) {
            //     newRect.element.dataset.markerr = "moved";
            // }
        });

        newRect.on("dragstart", (_event) => {
            removeAnnotatorInputIfPresent();
        });

        newRect.on("dragmove", (_event) => {
            // const { x, y } = newRect.getAbsolutePosition();
            // const titleElementPopper = rectDOMTarget.getAttribute("data-annotate-id");
            // if (titleElementPopper) {

            // }
            rectDOMTarget.style.top = `${newRect.y()}px`;
            rectDOMTarget.style.left = `${newRect.x()}px`;
            // if (titlePopperInstance) {
            //     titlePopperInstance.forceUpdate();
            // }
            // rectDOMTarget.style.backgroundColor = "red";

            // disable select similar button when el annotation is moved
            // if (newRect.markerrSelectSimilarButton) {
            //     newRect.markerrSelectSimilarButton.remove();
            //     newRect.markerrSelectSimilarButton = undefined;
            // }

            // if (newRect.element) {
            //     newRect.element.dataset.markerr = "moved";
            // }
        });

        //
        renderLabel(rectDOMTarget, {
            onInputSubmit: () => {
                draftRectangle.visible(false);
                draftRectangle.height(0);
                draftRectangle.width(0);
                layer.add(newRect);
                // titlePopperInstance = popperInstance;
                // newRect.destroy();
            },
            onInputCancel: (inputValue) => {
                if (inputValue.trim() === "") {
                    draftRectangle.visible(false);
                    draftRectangle.height(0);
                    draftRectangle.width(0);
                    rectDOMTarget.remove();
                }
            },
            onDelete: () => {
                // hide transformer handles
                selectShapes([]);
                // remove canvas and DOM target
                destroyShape(newRect)
            },
            showAnnotateSimilar: false,
            showBoundingBox: false,
        });

        boardElContainer.appendChild(rectDOMTarget);

        // layer.add(newRect);
        stage.draw();
    }

    // drag from and to positions
    // let x1, y1, x2, y2;

    stage.on("mousedown touchstart", (e) => {
        // do nothing if we mousedown on any shape
        if (e.target !== stage) {
            return;
        }
        e.evt.preventDefault();

        if (mode !== "drawing") {
            mode = "drawing";
            if (toolId === 2) {
                startDrag({ x: e.evt.layerX, y: e.evt.layerY });
                return;
            }
        }

        // if (toolId === 1) {
        //     mode = "selecting";
        //     x1 = stage.getPointerPosition().x;
        //     y1 = stage.getPointerPosition().y;
        //     x2 = stage.getPointerPosition().x;
        //     y2 = stage.getPointerPosition().y;

        //     selectionRectangle.visible(true);
        //     selectionRectangle.width(0);
        //     selectionRectangle.height(0);
        //     return;
        // } else if (mode !== "drawing") {
        //     mode = "drawing";
        //     if (toolId === 2) {
        //         startDrag({ x: e.evt.layerX, y: e.evt.layerY });
        //         return;
        //     }
        // }
    });

    stage.on("mousemove touchmove", (e) => {
        if (mode === "drawing") {
            if (toolId === 2) {
                updateDrag({ x: e.evt.layerX, y: e.evt.layerY });
                return;
            }
        }
        // do nothing if we didn't start selection
        // if (!selectionRectangle.visible()) {
        //     return;
        // }
        // e.evt.preventDefault();

        // // update drag to position
        // x2 = stage.getPointerPosition().x;
        // y2 = stage.getPointerPosition().y;

        // selectionRectangle.setAttrs({
        //     x: Math.min(x1, x2),
        //     y: Math.min(y1, y2),
        //     width: Math.abs(x2 - x1),
        //     height: Math.abs(y2 - y1),
        // });
    });

    stage.on("mouseup touchend", (e) => {
        // stageContainer.focus();
        if (mode === "drawing") {
            mode = "";
            if (toolId === 2) {
                // draftRectangle.visible(false);
                if (draftRectangle.height() < 10 && draftRectangle.width() < 10) {
                    return;
                }
                drawRectangle({
                    x: draftRectangle.x(),
                    y: draftRectangle.y(),
                    width: draftRectangle.width(),
                    height: draftRectangle.height(),
                });
                // draftRectangle.height(0);
                // draftRectangle.width(0);
                return;
            }
            return;
        }

        // do nothing if we didn't start selection
        // if (!selectionRectangle.visible()) {
        //     return;
        // }

        // mode = "";
        // e.evt.preventDefault();

        // // update visibility in timeout, so we can check it in click event
        // setTimeout(() => {
        //     selectionRectangle.visible(false);
        // });

        // let shapes = stage.find(".rect");
        // let box = selectionRectangle.getClientRect();
        // const nodes = shapes.filter((shape) =>
        //     Konva.Util.haveIntersection(box, shape.getClientRect())
        // );
        // selectShapes(nodes);

        // // nothing selected, clicked on stage, remove focus from annotation label
        // if (nodes.length === 0) {
        //     if (document.activeElement instanceof HTMLInputElement) {
        //         document.activeElement.blur();
        //     }
        // }
    });

    // clicks should select/deselect shapes
    stage.on("click tap", function (e) {
        // if we are selecting with rect, do nothing
        // if (selectionRectangle.visible()) {
        //     return;
        // }

        // if click on empty area - remove all selections
        if (e.target === stage) {
            // stageContainer.focus();
            removeAnnotatorInputIfPresent();
            selectShapes([]);
            return;
        }

        // Rectangle shape name mismatch
        if (!e.target.hasName("rect")) {
            return;
        }

        const metaPressed = e.evt.shiftKey || e.evt.ctrlKey || e.evt.metaKey;
        const isSelected = transformer.nodes().indexOf(e.target) >= 0;

        if (!metaPressed && !isSelected) {
            // select single shape
            selectShapes([e.target]);
        } else if (metaPressed && isSelected) {
            // remove selected node if meta key is pressed
            const nodes = transformer.nodes().slice();
            nodes.splice(nodes.indexOf(e.target), 1);
            selectShapes(nodes);
        } else if (metaPressed && !isSelected) {
            // add a node to selectedShapes
            const nodes = transformer.nodes().concat([e.target]);
            selectShapes(nodes);
        }
    });

    function selectShapes(shapes) {
        selectedShapes = shapes;
        transformer.nodes(shapes);
    }

    // reverse co-ords if user drags left / up
    function reverse({ x: x1, y: y1 }, { x: x2, y: y2 }) {
        let d;
        if (x1 > x2) {
            d = Math.abs(x1 - x2);
            x1 = x2;
            x2 = x1 + d;
        }
        if (y1 > y2) {
            d = Math.abs(y1 - y2);
            y1 = y2;
            y2 = y1 + d;
        }
        return { x1, y1, x2, y2 };
    }

    return [drawRectangle];
};

export default Board;

const regexEl = /^([^#\.\n]+)(.|#)?/gm;
const regexCssId = /#([^.#\n]+)/gm;
const regexCssClass = /\.([^.#\n]+)/gm;

function el(ele, attrs, children, text) {
    let selector = ele;
    let attributes = attrs;
    let innerText = text;
    let childEl = children;
    // ele, text
    if (typeof attrs === "string") {
        innerText = attrs;
        attributes = null;
    }
    // ele, children
    if (Array.isArray(attrs)) {
        childEl = attrs;
        attributes = null;
    }
    // ele, attrs, text | ele, children, text
    if (typeof children === "string") {
        innerText = children;
    }

    const { e: element, i: id, c: classNames } = parseSelector(selector);
    const e = document.createElement(element);
    if (id) {
        e.id = id;
    }
    if (classNames.length > 0) {
        e.classList.add(...classNames);
    }
    if (innerText) {
        e.innerText = innerText;
    }
    if (typeof attributes === "object" && !Array.isArray(attributes) && attributes !== null) {
        for (const [attr, value] of Object.entries(attributes)) {
            // hack - since both [] and setAttribute cannot set ALL properties
            if (attr.includes("data-")) {
                e.setAttribute(attr, value);
            } else {
                e[attr.toLowerCase()] = value;
            }
        }
    }
    if (Array.isArray(childEl)) {
        childEl.forEach((f) => e.appendChild(f));
    }
    return e;
}

function parseSelector(selector) {
    // get first grp of each match [1], then get first element [0]
    let element = Array.from(selector.matchAll(regexEl), (m) => m[1])[0];
    let classes = [];
    for (const match of selector.matchAll(regexCssClass)) {
        classes.push(match[1]);
    }
    let id = Array.from(selector.matchAll(regexCssId), (m) => m[1])[0];
    return { e: element, i: id, c: classes };
}

export function icon(ele, svgString) {
    const e = el(ele);
    e.innerHTML = svgString;
    return e;
}
