import { useState } from "preact/hooks";
import Combobox from "../combobox";
import { removeAnnotatorInput } from "../../lib/annotate";
import Overlay from "../../lib/overlay";
import { signal } from "@preact/signals";

import "./AnnotatorInput.css";
import { findSimilarElements } from "../../lib/similar";

const setSelectedItem = (selectedItem) => {
    console.log(selectedItem);
};

function getLabelsFilter(inputValue) {
    const lowerCasedInputValue = inputValue.toLowerCase();
    return function({ title, _value }) {
        return (
            !inputValue || title.toLowerCase().includes(lowerCasedInputValue)
        );
    };
}

const checked_signal = signal(false);

const Checkbox = () => {
    let handleClick = () => {
        checked_signal.value = !checked_signal.value;
    };

    return (
        <div className="checkbox_container" style={{
            display: "flex",
            alignItems: 'center'
        }}>
            <button
                className="checkbox_check"
                onClick={handleClick}
                style={
                    {
                        width: "14px",
                        height: "14px",
                        borderRadius: "3px",
                        border: checked_signal.value ? "1px solid #7c4dff" : "1px solid #d1d5db",
                        backgroundColor: checked_signal.value ? "#7c4dff" : "#fff",
                        marginRight: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        outline: "none",
                    }
                }
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
                    all: 'unset',
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
    /** @type [{title: string, value: {x: string, y: string}[]}[], any]*/
    const [items, setItems] = useState(
        JSON.parse(localStorage.getItem("items")) || []
    );

    let setLocalItems = (items) => {
        setItems(items);
        localStorage.setItem("items", JSON.stringify(items));
    };

    const handleSubmit = () => {
        // TODO: this is not a good way to get the value, but it works for now
        let input = document.querySelector(".annotator-combobox__input").value;

        if (input.trim() === "") {
            return;
        }

        if (element.getAttribute("data-annotate-title") === input) {
            return removeAnnotatorInput();
        }

        let similar_elements = findSimilarElements(element)

        similar_elements = similar_elements.filter((e) => !e.getAttribute("data-annotate.title"));


        let all_elements = [element, ...similar_elements]
        let xys = [];

        all_elements.forEach((ele) => {
            let x = ele.getBoundingClientRect().x + window.scrollX;
            let y = ele.getBoundingClientRect().y + window.scrollY;

            xys.push({ x, y })

            ele.setAttribute("data-annotate-title", input);
            ele.setAttribute("data-annotate-value", JSON.stringify({ x, y }));
        })

        if (items.some((item) => item.title === input)) {
            let newItems = items.map((item) => {
                if (item.title === input) {
                    return {
                        ...item,
                        value: [...item.value, ...xys]
                    }

                } else {
                    return item
                }
            })
            setLocalItems(newItems)
        } else {
            setLocalItems([...items, {
                title: input,
                value: [...xys]
            }])
        }


        let element_overlay = new Overlay({ disableTip: true });
        element_overlay.inspect(all_elements, input, true);

        removeAnnotatorInput();
    };

    return (
        <>
            <div className="annotator_input_container">
                <Combobox
                    label="Add Annotation"
                    defaultSelectedItemTitle={element.getAttribute("data-annotate-title") || null}
                    items={items}
                    setItems={setItems}
                    setSelectedItem={setSelectedItem}
                    getFilter={getLabelsFilter}
                />
                <div className="annotator_input_btns_container">
                    <div>
                        <Checkbox />
                    </div>

                    <div className="annotator_input_btns">
                        <button
                            onClick={() => removeAnnotatorInput()}
                            style={styles.btn_secondary}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            style={styles.btn_primary}
                        >
                            Annotate
                        </button>
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
    }

}


