import { h, render } from "preact";

const Popup = () => {

    const startMarkerr = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: "INIT" });
        // console.log(response);
    }

    const loginWithGoogle = async () => {
        const response = await chrome.runtime.sendMessage({action: "LOGIN"});
        // console.log(response);
    }

    return (
        <main>
            <div id="markerr-popup">
                <div>
                    <button onClick={startMarkerr}>Annotate</button>
                    <button onClick={loginWithGoogle}>Login with Google</button>
                </div>
            </div>
        </main>
    )
}

render(<Popup />, document.body)