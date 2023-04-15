import { initApp } from "../app";
import { compareVersions } from "compare-versions";
import { startInspectorMode } from "../lib/annotate"

console.log("Annotator Web Extension's content script");

function getInstalledVersion() {
    const manifest = chrome.runtime.getManifest();
    return manifest.version;
}

async function getLatestVersion() {
    const response = await fetch(process.env.UPDATE_CHECK_URL);
    const result = await response.json();
    return result.tag_name;
}

async function checkForUpdates() {
    const latest = await getLatestVersion();
    const installed = getInstalledVersion();
    const result = compareVersions(latest, installed);
    let update = { version: latest }
    if (result === -1) {
        update.downgrade = true;
    }
    if (result !== 0) {
        await chrome.storage.local.set({ update });
    } else {
        await chrome.storage.local.remove("update");
    }
}

checkForUpdates();

// inject the app
async function startAnnotator() {
    initApp();
    startInspectorMode();
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
    "START_ANNOTATOR": startAnnotator
}

