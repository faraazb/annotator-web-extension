import { useState } from "preact/hooks";
import CaptureAPI from "../capture-api";
import { blobToDataURL } from "../utils/blob";


const useScreenshot = () => {
    const [id, setId] = useState();
    const [screenshot, setScreenshot] = useState();
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

    async function displayCaptures(blobs, shouldSaveLocally, shouldUpload) {
        if (!blobs || !blobs.length) {
            setError("Couldn't take screenshot")
            return;
        }

        const screenshotId = crypto.randomUUID();
        setId(screenshotId);
        setScreenshot(blobs)

        const files = [];

        // Save each file, triggers browser's multiple save permission box

        for (const { blob, name } of blobs) {
            if (shouldSaveLocally) {
                let link = document.createElement("a");
                let url = URL.createObjectURL(blob);
                link.href = url;
                link.download = name;
                document.body.appendChild(link);
                link.click();
                setTimeout(function () {
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                }, 0);
            }

            // if (shouldUpload) {
            //     const dataURI = await blobToDataURL(blob);
            //     files.push({ name, dataURI });
            // }
        }

        // if (shouldUpload) {
        //     await chrome.storage.local.set({ [screenshotId]: files });
        // }

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

    const takeScreenshot = ({ tab, shouldSaveLocally = false, shouldUpload = false }) => {
        if (!tab) {
            throw new Error("Missing tab argument");
        }
        CaptureAPI.captureToFiles(
            tab,
            getFilename(tab.url),
            (blobs) => displayCaptures(blobs, shouldSaveLocally, shouldUpload),
            errorHandler,
            updateProgress,
            splitNotifier
        );
    }

    return [id, takeScreenshot, screenshot, progress, splitted, error]
}

export default useScreenshot;