import { useState } from "preact/hooks";
import Combobox from "../combobox";
import { removeAnnotatorInput } from "../../lib/annotate"
import Overlay from "../../lib/overlay"
import { signal } from "@preact/signals";

import "./AnnotatorInput.css";

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
        checked_signal.value = !checked_signal.value
    }

    return (
        <div className="checkbox_container" >
            <button
                className="checkbox_check"
                onClick={handleClick}
                style={checked_signal.value && {
                    backgroundColor: "rgb(114, 52, 205)",
                    borderColor: "rgb(114, 52, 205)",
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
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                ) : null}
            </button>
            <label onClick={handleClick} style={{ fontSize: '14px', userSelect: 'none' }} >Annotate similar elements</label>
        </div>
    )
}

const AnnotatorInput = ({ element }) => {
    // const [items, setItems] = useState([{ title: "Hello", value: "Hello" }]);
    const [items, setItems] = useState(JSON.parse(localStorage.getItem("items")) || []);

    let setLocalItems = (items) => {
        setItems(items);
        localStorage.setItem("items", JSON.stringify(items));
    }


    const handleSubmit = () => {
        // TODO: this is not a good way to get the value, but it works for now
        let value = document.querySelector(".annotator-combobox__input").value

        if (!items.some((existingItem) => existingItem.value === value)) {
            setLocalItems([...items, { title: value, value: value }]);
        }

        removeAnnotatorInput()
        let element_overlay = new Overlay(element, value);

        if (element) {
            element_overlay.inspect([element], value, element)
        }
    }



    return (
        <div className="annotator_input_container" >
            <Combobox
                items={items}
                setItems={setItems}
                setSelectedItem={setSelectedItem}
                getFilter={getLabelsFilter}
            />
            <div className="annotator_input_btns_container" >

                <div>
                    <Checkbox />
                </div>

                <div className="annotator_input_btns" >
                    <button onClick={() => removeAnnotatorInput()} className="annotator_input_btn_danger" >Cancel</button>
                    <button onClick={handleSubmit} className="annotator_input_btn_primary" >Submit</button>
                </div>
            </div>
        </div>

    );
};

export default AnnotatorInput;
