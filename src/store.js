import createStore from "teaful";

export const tools = {
    SELECT: 1,
    RECTANGLE: 2,
    ELEMENT_PICKER: 3
};

// although the same store can be used in bg and content
// remember that they are seperate instances and are not shared
// any other type of state sharing must happen through chrome.storage

const initialStore = {
    user: null,
    selectedTool: tools.ELEMENT_PICKER,
    toolsOpen: true,
    leaderboard: [],
    annotations: [],
};

const { useStore, getStore } = createStore(initialStore);

export { useStore, getStore };