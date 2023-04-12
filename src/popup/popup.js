import { h, render } from "preact";
import { useEffect } from "preact/hooks";
import Router from "preact-router";
import history from "./history";
import { useStore } from "../store";
import Home from "./pages/home";
import "./popup.css";
import { getLabels } from "../api";

const Popup = () => {
    const [user, setUser] = useStore.user();

    useEffect(() => {
        (async function () {
            const result = await chrome.storage.local.get("user");
            if ("user" in result) {
                setUser(result.user);
            }
        })();
    }, []);

    return (
        <main>
            <div id="markerr-popup" className="popup">
                <Router history={history}>
                    <Home path="/" />
                </Router>
            </div>
        </main>
    );
};

render(<Popup />, document.body);

(async () => {
    let res = await getLabels();
    let labels = res.data.labels;
    await chrome.storage.local.set({ labels });
})();
