import { useEffect, useState } from "preact/hooks";
import { render } from "preact";
import Combobox from "../combobox";
import { removeAnnotatorInput } from "../../lib/annotate";
import Overlay from "../../lib/overlay";
import { signal } from "@preact/signals";

import "./AnnotatorInput.css";
import { findSimilarElements } from "../../lib/similar";
import { computeStyles, createPopper } from "@popperjs/core";

// Generate a UUID using the built-in crypto API
function generateUUID() {
    let data = crypto.getRandomValues(new Uint8Array(16));
    data[6] = (data[6] & 0x0f) | 0x40;
    data[8] = (data[8] & 0x3f) | 0x80;
    return Array.from(data, (byte) => ("0" + byte.toString(16)).slice(-2)).join(
        ""
    );
}

function getLabelsFilter(inputValue) {
    const lowerCasedInputValue = inputValue.toLowerCase();
    return function({ title }) {
        return (
            !inputValue || title.toLowerCase().includes(lowerCasedInputValue)
        );
    };
}

function detectCollision(element1, element2) {
    const {
        top: top1,
        right: right1,
        bottom: bottom1,
        left: left1,
    } = element1.getBoundingClientRect();
    const {
        top: top2,
        right: right2,
        bottom: bottom2,
        left: left2,
    } = element2.getBoundingClientRect();

    return !(
        right1 < left2 ||
        left1 > right2 ||
        bottom1 < top2 ||
        top1 > bottom2
    );
}

const checked_signal = signal(false);

const Checkbox = () => {
    let handleClick = () => {
        checked_signal.value = !checked_signal.value;
    };

    return (
        <div
            className="checkbox_container"
            style={{
                display: "flex",
                alignItems: "center",
            }}
        >
            <button
                className="checkbox_check"
                onClick={handleClick}
                style={{
                    all: 'unset',
                    width: "14px",
                    height: "14px",
                    borderRadius: "3px",
                    border: checked_signal.value
                        ? "1px solid #7c4dff"
                        : "1px solid #d1d5db",
                    backgroundColor: checked_signal.value ? "#7c4dff" : "#fff",
                    marginRight: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    outline: "none",
                    cursor: "pointer"
                }}
            >
                {checked_signal.value ? (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                        stroke="#fff"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                        />
                    </svg>
                ) : null}
            </button>
            <label
                onClick={handleClick}
                style={{
                    all: "unset",
                    fontSize: "14px",
                    userSelect: "none",
                    color: "#4a556d",
                }}
                className="checkbox_label"
            >
                Annotate similar elements
            </label>
        </div>
    );
};

const AnnotatorInput = ({ element }) => {
    // const [items, setItems] = useState([{ title: "Hello", value: "Hello" }]);
    /** @type [{title: string, value: {x: string, y: string, id: string}[]}[], any]*/
    const [items, setItems] = useState(
        JSON.parse(localStorage.getItem("items")) || []
    );



    const [canDelete] = useState(() =>
        Boolean(element.getAttribute("data-annotate-id"))
    );

    let setLocalItems = (items) => {
        setItems(items);
        localStorage.setItem("items", JSON.stringify(items));
    };

    const handleSubmit = () => {
        let input = document.querySelector(".annotator-combobox__input").value;

        if (input.trim() === "") {
            // delete the annotation if there is already annotated
            return;
        }

        if (element.getAttribute("data-annotate-title") === input) {
            return removeAnnotatorInput();
        }

        let similar_elements = [];
        if (checked_signal.value) {
            similar_elements = findSimilarElements(element);
        }

        similar_elements = similar_elements.filter(
            (e) => !e.getAttribute("data-annotate-id")
        );

        let all_elements = [element, ...similar_elements];
        let xys = [];

        all_elements.forEach((ele) => {
            if (ele.getAttribute("data-annotate-id") === input) {
                return;
            }

            let x = ele.getBoundingClientRect().x + window.scrollX;
            let y = ele.getBoundingClientRect().y + window.scrollY;

            let id = generateUUID();
            ele.setAttribute("data-annotate-id", id);
            ele.setAttribute("data-annotate-title", input);
            ele.setAttribute("data-annotate-value", JSON.stringify({ x, y }));

            xys.push({ x, y, id, width: ele.getBoundingClientRect().width, height: ele.getBoundingClientRect().height });

            let element_styels = window.getComputedStyle(ele);

            let div = document.createElement("div");
            div.className = "annotate-element-title";
            div.id = ele.getAttribute("data-annotate-id");
            div.style.width = element_styels.width;

            let app_container = document.querySelector(
                "#annotator-app-container"
            );
            app_container.appendChild(div);

            let paddingTop =
                parseInt(window.getComputedStyle(ele).paddingTop, 10) || 0;
            let paddingLeft =
                parseInt(window.getComputedStyle(ele).paddingLeft, 10) || 0;
            let paddingBottom =
                parseInt(window.getComputedStyle(ele).paddingBottom, 10) || 0;

            render(
                <p
                    style={{
                        all: "unset",
                        color: "red",
                        fontSize: "24px",
                        display: "block",
                        marginLeft: paddingLeft + "px",
                        // "-webkit-text-stroke": "1px #fff",
                        // fontWeight: "bold"
                        fontWeight: 500
                    }}
                >
                    {input}
                </p>,
                div
            );

            let popper_instance = createPopper(ele, div, {
                placement: "top",
                modifiers: [
                    {
                        name: "offset",
                        options: {
                            offset: ({ placement }) => {
                                if (placement === "top") {
                                    return [0, -paddingTop];
                                }

                                if (placement === "bottom") {
                                    return [0, -paddingBottom];
                                }

                                return [0, 0];
                            },
                        },
                    },
                    {
                        name: "flip",
                        options: {
                            // this will disable flip
                            fallbackPlacements: [],
                        },
                    },
                ],
                strategy: "absolute",
            });

            popper_instance.update().then((ads) => {
                let rects = ads.elements.popper.getBoundingClientRect();
                let eles_from_point = document.elementsFromPoint(
                    rects.x,
                    rects.y
                );

                let my_element = eles_from_point.find((e) => {
                    if (e.getAttribute("class") === "annotate-element-title") {
                        return e;
                    }
                });

                if (my_element) {
                    let to_compare = document.getElementsByClassName(
                        "annotate-element-title"
                    );
                    to_compare = Array.from(to_compare).filter(
                        (e) => e.id !== my_element.id
                    );
                    to_compare.forEach((e) => {
                        let collides = detectCollision(e, my_element);
                        if (collides) {
                            popper_instance.setOptions({
                                placement: 'bottom',
                            }).then(() => {
                                popper_instance.forceUpdate()
                            })
                        }
                    });
                }

                let element_overlay = new Overlay({
                    disableTip: true,
                    id: `data-annotate-id-${id}`,
                });

                let isElementIselftFixedOrSticky =
                    window.getComputedStyle(ele).position === 'fixed' || window.getComputedStyle(ele).position === 'sticky';

                const fixedOrAbsoluteAncestor =
                    Boolean(ele.closest('[style*="position: fixed"], [style*="position: sticky"]'));

                if (isElementIselftFixedOrSticky || fixedOrAbsoluteAncestor) {
                    element_overlay.inspect([ele], input, true, 'fixed');
                } else {
                    element_overlay.inspect([ele], input, true);
                }
            });
        });

        if (items.some((item) => item.title === input)) {
            let newItems = items.map((item) => {
                if (item.title === input) {
                    return {
                        ...item,
                        value: [...item.value, ...xys],
                    };
                } else {
                    return item;
                }
            });
            setLocalItems(newItems);
        } else {
            setLocalItems([
                ...items,
                {
                    title: input,
                    value: [...xys],
                },
            ]);
        }

        removeAnnotatorInput();
    };

    const handleEdit = () => {
        let input = document.querySelector(".annotator-combobox__input").value;

        if (input.trim() === "") {
            return;
        }

        let id = element.getAttribute("data-annotate-id");
        let popper = document.getElementById(id);
        popper.getElementsByTagName("p")[0].innerText = input;

        let newItems = items.map((item) => {
            if (item.title === element.getAttribute("data-annotate-title")) {
                return {
                    ...item,
                    value: item.value.filter((v) => v.id !== id),
                };
            } else {
                return item;
            }
        });

        element.setAttribute("data-annotate-title", input);
        let element_xy = JSON.parse(
            element.getAttribute("data-annotate-value")
        );

        if (newItems.some((item) => item.title === input)) {
            let finalItems = newItems.map((item) => {
                if (item.title === input) {
                    return {
                        ...item,
                        value: [
                            ...item.value,
                            {
                                id,
                                x: element_xy.x,
                                y: element_xy.y,
                            },
                        ],
                    };
                } else {
                    return item;
                }
            });
            setLocalItems(finalItems);
        } else {
            setLocalItems([
                ...newItems,
                {
                    title: input,
                    value: [
                        {
                            id,
                            x: element_xy.x,
                            y: element_xy.y,
                        },
                    ],
                },
            ]);
        }

        removeAnnotatorInput();
    };

    const handleDelete = () => {
        // 1. remove attributes from the element
        // 2. remove the popper
        // 3. remove the element from the items array
        // 4. remove the border to the annotated element

        let id = element.getAttribute("data-annotate-id");

        element.removeAttribute("data-annotate-id");
        element.removeAttribute("data-annotate-title");
        element.removeAttribute("data-annotate-value");

        let popper = document.getElementById(id);
        popper.remove();

        let newItems = items.map((item) => {
            return {
                ...item,
                value: item.value.filter((xy) => {
                    return xy.id !== id;
                }),
            };
        });

        setLocalItems(newItems);

        document.getElementById(`data-annotate-id-${id}`).remove();

        removeAnnotatorInput();
    };

    return (
        <>
            <div className="annotator_input_container">
                <Combobox
                    label="Add Annotation"
                    defaultSelectedItemTitle={
                        element.getAttribute("data-annotate-title") || null
                    }
                    items={items}
                    setItems={setItems}
                    setSelectedItem={() => { }}
                    getFilter={getLabelsFilter}
                />
                <div className="annotator_input_btns_container">
                    <div>
                        <Checkbox />
                    </div>

                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: "24px",
                            alignItems: "center",
                        }}
                    >
                        <div>
                            {canDelete ? (
                                <button
                                    onClick={handleDelete}
                                    className="checkbox_check"
                                    style={{
                                        all: "unset",
                                        width: "18px",
                                        height: "18px",
                                        borderRadius: "3px",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        outline: "none",
                                        cursor: "pointer",
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke-width="2"
                                        stroke="red"
                                    >
                                        <path
                                            stroke-linecap="round"
                                            stroke-linejoin="round"
                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                        />
                                    </svg>
                                </button>
                            ) : null}
                        </div>

                        <div>
                            <button
                                onClick={() => removeAnnotatorInput()}
                                style={styles.btn_secondary}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={
                                    element.getAttribute("data-annotate-id")
                                        ? handleEdit
                                        : handleSubmit
                                }
                                style={styles.btn_primary}
                            >
                                Annotate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div id="arrow" data-popper-arrow></div>
        </>
    );
};

export default AnnotatorInput;

/** @type Object.<string, React.CSSProperties> */
const styles = {
    btn_primary: {
        all: "unset",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "10px",
        paddingRight: "10px",
        backgroundColor: "#7c4dff",
        color: "#ffffff",
        fontSize: "14px",
        lineHeight: "20px",
        fontWeight: "600",
        borderRadius: "6px",
        outline: "none",
        border: "none",
        cursor: "pointer",
    },
    btn_secondary: {
        all: "unset",
        paddingTop: "6px",
        paddingBottom: "6px",
        paddingLeft: "10px",
        paddingRight: "10px",
        fontSize: "14px",
        lineHeight: "20px",
        fontWeight: "600",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        color: "#4a556d",
        marginRight: "8px",
        cursor: "pointer",
        border: "none",
        outline: "none",
    },
};
