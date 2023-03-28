import { useState } from "preact/hooks";
import CaptureAPI from "../capture-api";


const useScreenshot = () => {
    const [id, setId] = useState(crypto.randomUUID());
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(0);
    const [splitted, setSplitted] = useState(false);

    function getFilename(contentURL) {
        var name = contentURL.split("?")[0].split("#")[0];
        if (name) {
            name = name
                .replace(/^https?:\/\//, "")
                .replace(/[^A-z0-9]+/g, "-")
                .replace(/-+/g, "-")
                .replace(/^[_\-]+/, "")
                .replace(/[_\-]+$/, "");
            name = "-" + name;
        } else {
            name = "";
        }
        return "screencapture" + name + "-" + Date.now() + ".png";
    }

    async function displayCaptures(blobs) {
        if (!blobs || !blobs.length) {
            setError("Couldn't take screenshot")
            return;
        }

        // const files = [];
        // const screenshotId = id;

        // Save each file, triggers browser's multiple save permission box
        for (const { blob, name } of blobs) {
            // const dataURI = await blobToDataURL(blob);
            // files.push({ name, dataURI });
            let link = document.createElement("a");
            let url = URL.createObjectURL(blob);
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            setTimeout(function() {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);  
            }, 0);
        }

        // Store screenshot dataUri in storage and open a new tab
        // which uses the dataUri to show the captured screenshots

        // await chrome.storage.local.set({ [screenshotId]: files });
        // const { ok, tab } = await chrome.runtime.sendMessage({
        //     action: "CREATE_TAB",
        //     payload: {
        //         url: `pages/screenshot.html?id=${screenshotId}`,
        //     },
        // });
    }

    function errorHandler(reason) {
        setError(reason);
    }

    function updateProgress(complete) {
        setProgress(complete)
    }

    function splitNotifier() {
        setSplitted(true);
    }

    function blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (_e) => resolve(reader.result);
            reader.onerror = (_e) => reject(reader.error);
            reader.onabort = (_e) => reject(new Error("Read aborted"));
            reader.readAsDataURL(blob);
        });
    }

    const takeScreenshot = ({ tab }) => {
        if (!tab) {
            throw new Error("Missing tab argument");
        }
        console.log("Taking screenshot")
        CaptureAPI.captureToFiles(
            tab,
            getFilename(tab.url),
            displayCaptures,
            errorHandler,
            updateProgress,
            splitNotifier
        );
    }

    return [takeScreenshot, progress, splitted, error]
}

export default useScreenshot;