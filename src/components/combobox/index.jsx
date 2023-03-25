import { useState } from "preact/hooks";
import { useCombobox } from "downshift";
import "./combobox.css";

// A combobox component created using downshift
const Combobox = (props) => {
    const {
        items,
        setItems,
        setSelectedItem,
        getFilter,
        allowCreation = false,
        classNames = {},
    } = props;
    // TODO unused classnames props, maybe get rid of this
    const { inputClassName, menuClassName, menuItemClassName } = classNames;
    const [filteredItems, setFilteredItems] = useState(items || []);

    const {
        isOpen,
        getToggleButtonProps,
        getLabelProps,
        getMenuProps,
        getInputProps,
        highlightedIndex,
        getItemProps,
        selectedItem,
    } = useCombobox({
        items: filteredItems,
        onSelectedItemChange: ({ selectedItem }) => {
            setSelectedItem(selectedItem);
        },
        onInputValueChange: ({ inputValue }) => {
            setFilteredItems(items.filter(getFilter(inputValue)));
        },
        itemToString(item) {
            return item ? item.title : "";
        },
        stateReducer: (state, actionAndChanges) => {
            const { type, changes } = actionAndChanges;
            switch (type) {
                case useCombobox.stateChangeTypes.InputKeyDownEnter: {
                    const { highlightedIndex, inputValue } = changes;
                    // if no existing option is highlighted, create option if test fails for empty/whitespaces
                    if (highlightedIndex === -1 && allowCreation && !/^\s*$/.test(inputValue)) {
                        addItem({ title: inputValue, value: inputValue });
                    }
                    return changes;
                }
                default: {
                    return changes;
                }
            }
        },
    });

    const addItem = (item) => {
        if (items.some((existingItem) => existingItem.value === item.value)) {
            return false;
        }
        if (setItems) {
            setItems((prevItems) => [...prevItems, item]);
        }
        return true;
    };

    return (
        <div className="annotator-combobox">
            <input
                className={`annotator-combobox__input${
                    inputClassName ? " " + inputClassName : ""
                }`}
                type="text"
                placeholder="Add a label"
                {...getInputProps()}
            />
            <ul
                {...getMenuProps()}
                className="annotator-combobox__menu"
                style={{ display: isOpen ? "block" : "none" }}
                data-open={isOpen}
            >
                {isOpen && filteredItems.length === 0 ? (
                    allowCreation ? (
                        <div className="annotator-combobox__menu-message">
                            Press enter to create
                        </div>
                    ) : (
                        <div className="annotator-combobox__menu-message--disabled">
                            No options
                        </div>
                    )
                ) : (
                    isOpen &&
                    filteredItems.map((item, index) => (
                        <li
                            className={`annotator-combobox__item${
                                highlightedIndex === index ? " highlight" : ""
                            }`}
                            {...getItemProps({ item, index })}
                            key={`${item.value}${item.index}`}
                        >
                            {item.title}
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default Combobox;
