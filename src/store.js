import createStore from "teaful";

const initialStore = {
    user: null,
};

const { useStore, getStore } = createStore(initialStore);

export { useStore, getStore };