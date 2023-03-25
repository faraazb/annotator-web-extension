import { useState } from "preact/hooks";
import Combobox from ".";

const setSelectedItem = (selectedItem) => {
    console.log(selectedItem);
};

function getLabelsFilter(inputValue) {
    const lowerCasedInputValue = inputValue.toLowerCase();
    return function ({ title, _value }) {
        return (
            !inputValue || title.toLowerCase().includes(lowerCasedInputValue)
        );
    };
}

const ComboboxExample = () => {
    // each item must have a title and value
    // but we don't really need value, can reconsider
    const [items, setItems] = useState([{ title: "Hello", value: "Hello" }]);

    return (
        <Combobox
            items={items}
            setItems={setItems}
            setSelectedItem={setSelectedItem}
            getFilter={getLabelsFilter}
            allowCreation={true}
        />
    );
};

export default ComboboxExample;
