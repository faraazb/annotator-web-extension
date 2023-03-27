import { h, render } from "preact";

const Popup = () => {

    const startAnnotator = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const response = await chrome.tabs.sendMessage(tab.id, { action: "START_ANNOTATOR" });
        console.log(response)
        window.close()
        // console.log(response);
    }

    const loginWithGoogle = async () => {
        const response = await chrome.runtime.sendMessage({action: "LOGIN"});
        console.log(response);
    }

    return (
        <main>
            <div id="markerr-popup">
                <div>
                    <button onClick={startAnnotator}>Annotate</button>
                    <button onClick={loginWithGoogle}>Login with Google</button>
                </div>
            </div>
        </main>
    )
}

render(<Popup />, document.body)
