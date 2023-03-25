import { initApp } from "../app";

console.log("Content script loaded");


let isAnnotatorInjected = false;

// inject the app
async function init() {
    if (isAnnotatorInjected) {
        return { ok: true };
    }
    try {
        isAnnotatorInjected = true;
        initApp();
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const { action, payload } = message;
    if (action in handlers) {
        handlers[action](payload).then((v) => sendResponse(v));
    }
    return true;
});


// each handler must be an async fucntion or return a Promise
// TODO within the content script, most operations will be synchronous
// so we can reevaluate this, rn it is to be inline
// with the bg script which will usually make network requests, do async storage
// operations, etc.
const handlers = {
    "INIT": init
}

