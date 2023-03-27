// Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "annotator-cm-1",
        title: "Annotate"
    });
});

chrome.contextMenus.onClicked.addListener(
    async (_info, _tab) => {
        // info will have information about the cm clicked
        // const response = await chrome.tabs.sendMessage(tab.id, { action: "INIT" });
        // console.log(response)
    }
);


async function loginWithGoogle() {
    return { ok: true }
}


// Messaging
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const { action, payload } = message;
    // if action has an associated handler, call it and return the result
    if (action in handlers) {
        handlers[action](payload).then((v) => sendResponse(v));
    }
    // must return true to indicate that the message will be responded to, asynchronously
    return true;
});


// each handler must be an async fucntion or return a Promise
const handlers = {
    "LOGIN": loginWithGoogle
}
