import { getUserInfo, login, logout } from "./oauth";

// Context Menu
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "annotator-cm-1",
        title: "Annotate"
    });
});

chrome.contextMenus.onClicked.addListener(
    async (_info, tab) => {
        // info will have information about the cm clicked
        const response = await chrome.tabs.sendMessage(tab.id, { action: "INIT" });
    }
);


async function loginGoogle() {
    try {
        const token = await login();
        // TODO token is unused in getUserInfo
        const result = await getUserInfo(token);
        if (result) {
            await chrome.storage.local.set({ user: result });
            return { ok: true, data: result }
        } else {
            return { ok: false };
        }
    } catch (err) {
        console.log(err)
        return { ok: false, error: err };
    }
}

async function logoutGoogle() {
    try {
        const result = await logout();
        console.log(result)
        if (result) {
            await chrome.storage.local.remove("user");
            return { ok: result }
        }
    } catch (err) {
        console.log(err)
        return { ok: false, error: err };
    }
}


async function createTab(options) {
    const tab = await chrome.tabs.create(options);
    return tab;
}

async function queryTabs(query) {
    try {
        const tabs = await chrome.tabs.query(query);
        return { ok: true, tabs };
    } catch (err) {
        return { ok: false, error: err.message }
    }
}


async function captureVisibleTab(options = { format: "png" }) {
    try {
        const dataURI = await chrome.tabs.captureVisibleTab(options);
        return { ok: true, dataURI };
    } catch (err) {
        return { ok: false };
    }
}


// Messaging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    "LOGIN": loginGoogle,
    "LOGOUT": logoutGoogle,
    "CREATE_TAB": createTab,
    "QUERY_TABS": queryTabs,
    "CAPTURE_TAB": captureVisibleTab
}
