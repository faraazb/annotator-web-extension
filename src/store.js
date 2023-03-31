import createStore from "teaful";

const initialStore = {
    user: null,
    leaderboard: [],
};

const { useStore, getStore } = createStore(initialStore);

export { useStore, getStore };