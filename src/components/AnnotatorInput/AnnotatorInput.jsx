import { useState } from "preact/hooks";
import Combobox from "../combobox";
import { removeAnnotatorInput } from "../../lib/annotate"
import Overlay from "../../lib/overlay"
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

const AnnotatorInput = ({ element }) => {
    // const [items, setItems] = useState([{ title: "Hello", value: "Hello" }]);
    const [items, setItems] = useState(JSON.parse(localStorage.getItem("items")) || []);

    let setLocalItems = (items) => {
        setItems(items);
        localStorage.setItem("items", JSON.stringify(items));
    }

    console.log("items ", items)

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

        console.log("current element is ", element)
    }

    return (
        <div className="ai_container" >
            <Combobox
                items={items}
                setItems={setItems}
                setSelectedItem={setSelectedItem}
                getFilter={getLabelsFilter}
            />
            <div className="ai_btns_container" >
                <div className="ai_btns_left" >
                    <button className="ai_btn_primary" >Annotate Similar</button>
                </div>
                <div className="ai_btns_right" >
                    <button onClick={() => removeAnnotatorInput()} className="ai_btn_danger" >Cancel</button>
                    <button onClick={handleSubmit} className="ai_btn_primary" >Submit</button>
                </div>
            </div>
        </div>

    );
};

export default AnnotatorInput;
