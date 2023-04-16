import { createAnnotation, createUser } from "./api";
import { getUserInfo, login, logout } from "./oauth";
import { dataURLtoFile } from "./utils/blob";

async function loginGoogle() {
    try {
        const token = await login();
        // TODO token is unused in getUserInfo
        const result = await getUserInfo(token);
        if (result) {
            const { email } = result;
            // create user on server
            const { ok, data } = await createUser({ email });
            if (ok || data.msg.includes("already registered")) {
                await chrome.storage.local.set({ user: result });
                return { ok: true, data: result };
            }
        }
        return { ok: false };
    } catch (err) {
        return { ok: false, error: err };
    }
}

async function logoutGoogle() {
    try {
        const result = await logout();
        if (result) {
            await chrome.storage.local.remove("user");
            return { ok: result };
        }
    } catch (err) {
        console.error(err);
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
        return { ok: false, error: err.message };
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

/**
 *
 * @param {string} screenshot - Data URL
 * @param {string} name - name to use for the screenshot file
 * @param {Object[]} annotations
 * @param {number} annotations[].label
 * @param {number} annotations[].x
 * @param {number} annotations[].y
 * @param {number} annotations[].width
 * @param {number} annotations[].height
 */
async function submitPageAnnotation({ screenshotURL, name, annotations, email, url }) {
    // Prepare labels text file with the structure:
    // label,x,y,width,height\n
    const labelsData = annotations.map(({ x, y, width, height, title }) => [title, x, y, width, height]).join("\n");
    const labelsBlob = new Blob([labelsData], { type: "text/plain" });
    const labelsFile = new File([labelsBlob], "labels.txt", {
        type: "text/plain",
    });

    // console.log(labelsData);

    const response = await createAnnotation({
        screenshot: dataURLtoFile(screenshotURL, name),
        annotations: labelsFile,
        email,
        url,
    });
    return response;
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
    LOGIN: loginGoogle,
    LOGOUT: logoutGoogle,
    CREATE_TAB: createTab,
    QUERY_TABS: queryTabs,
    CAPTURE_TAB: captureVisibleTab,
    CREATE_ANNOTATION: submitPageAnnotation,
};
