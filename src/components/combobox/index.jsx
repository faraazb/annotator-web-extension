import { useState } from "preact/hooks";
import { useCombobox } from "downshift";
import "./combobox.css";



/** @type {Object.<string, React.CSSProperties>} */
const styles = {
    combobox_input: {
        all: "unset",
        backgroundColor: "red",
        width: "300px",
        height: "100%",
        border: "1.5px solid #d9d9d9",
        borderRadius: "6px",
        padding: "10px 12px",
        fontSize: "16px",
        color: "var(--text-1)",
        backgroundColor: "#ffffff",
        transition: "border-color 0.15s ease-in-out 0s",
        outline: "none",
        fontWeight: "normal",
        position: "relative",
    },
    annotator_combobox: {
        userSelect: 'none',
        position: "relative"
    },
    combobox_menu: {
        all: 'unset',
        display: "block",
        width: "100%",
        position: "absolute",
        overflow: "scroll",
        maxHeight: "180px",
        backgroundColor: "#ffffff",
        color: "var(--text-1)",
        borderRadius: "4px",
        listStyleType: "none",
        overflowX: "hidden",
        overflowY: "auto",
        listStyle: 'none',
    },
    combobox_menu_item: {
        padding: "10px 12px",
        userSelect: "none",
        transition: "background 20ms ease-in 0s",
        cursor: "pointer",
        borderRadius: "4px",
        fontSize: "16px",
    },
    combobox_label: {
        fontSize: "14px",
        color: "rgb(74, 85, 109)",
        fontWeight: "600",
        marginBottom: "4px",
        display: "block",
    }
}



// A combobox component created using downshift
const Combobox = (props) => {
    const {
        items,
        setItems,
        setSelectedItem,
        getFilter,
        allowCreation = false,
        classNames = {},
        defaultSelectedItemTitle,
        label

    } = props;
    // TODO unused classnames props, maybe get rid of this
    const { inputClassName } = classNames;
    const [filteredItems, setFilteredItems] = useState(items || []);

    const {
        isOpen,
        getMenuProps,
        getInputProps,
        highlightedIndex,
        getItemProps,
        reset,
        inputValue,
        openMenu,
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
        defaultSelectedItem: defaultSelectedItemTitle ? items.find((item) => item.title === defaultSelectedItemTitle) : null
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
        <div className="annotator-combobox" style={styles.annotator_combobox}  >
            <div style={{ position: 'relative', maxHeight: '100%' }} >
                <label htmlFor="combobox_input" style={styles.combobox_label} >
                    {label}
                </label>
                <div style={{ position: "relative" }} >
                    <input
                        className={`annotator-combobox__input${inputClassName ? " " + inputClassName : ""}`}
                        type="text"
                        id="combobox_input"
                        placeholder="Add annotation"
                        {...getInputProps({
                            style: styles.combobox_input,
                        })}
                    />
                    <div style={{ position: 'absolute', right: "10px", top: "50%", transform: "translate(0, -50%)", display: 'flex', alignItems: "center", }} >
                        {inputValue.trim().length > 0 ? (
                            <button onClick={() => reset()} style={{ background: '#fff', border: 'none', outline: 'none', width: '24px', height: '24px', cursor: 'pointer', color: "#4a556d", display: "flex", alignItems: 'center', justifyContent: "center" }} >
                                <svg style={{ width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" >
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        ) : (
                            null
                        )}

                        <button onClick={() => openMenu()} style={{ background: '#fff', border: 'none', outline: 'none', width: '24px', height: '24px', cursor: "pointer", color: "#4a556d", display: 'flex', alignItems: 'center', justifyContent: 'center' }} >
                            <svg style={{ width: 16, height: 16 }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>
            <ul
                {...getMenuProps({})}
                className="annotator-combobox__menu"
                style={isOpen && filteredItems.length > 0 ? styles.combobox_menu : { display: 'none' }}
                data-open={isOpen}
            >
                {filteredItems.map((item, index) => (
                    <li
                        className={`annotator-combobox__item${highlightedIndex === index ? " highlight" : ""
                            }`}
                        {...getItemProps({ item, index })}
                        key={`${item.value}${item.index}`}
                        style={styles.combobox_menu_item}
                    >
                        {item.title}
                    </li>
                ))}
            </ul>

        </div>
    );
};

export default Combobox;
