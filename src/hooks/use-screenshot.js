import { useState } from "preact/hooks";
import CaptureAPI from "../capture-api";
import imageBlobReduce from "image-blob-reduce";
// import { blobToDataURL, convertFileSize } from "../utils/blob";


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

    function max(nums) {
        return Math.max.apply(
            Math,
            nums.filter(function (x) {
                return x;
            })
        );
    }

    async function displayCaptures(blobs, shouldSaveLocally, shouldUpload, compress = false) {
        if (!blobs || !blobs.length) {
            setError("Couldn't take screenshot")
            return;
        }
        let screenshotBlobs = blobs;
        if (compress) {
            try {
                screenshotBlobs = [];
                for (const { blob, name } of blobs) {
                    // console.log(convertFileSize(blob.size))
                    const { fullWidth, fullHeight } = CaptureAPI.getDimensions();
                    // scale larger side down by 75%
                    let max = (fullHeight > fullWidth ? fullHeight : fullWidth) * 0.75;
                    // console.log(fullHeight, fullWidth, max)

                    const compressedBlob = await imageBlobReduce().toBlob(blob, { max: max });
                    // console.log(convertFileSize(compressedBlob.size))
                    screenshotBlobs.push({ blob: compressedBlob, name });
                }
            } catch (error) {
                // if compression fails fallback to uncompressed blobs
                console.log("Annotator: Compression failed")
                screenshotBlobs = blobs;
            }
        }


        const screenshotId = crypto.randomUUID();
        setId(screenshotId);
        setScreenshot(screenshotBlobs)

        // const files = [];

        // Save each file, triggers browser's multiple save permission box

        for (const { blob, name } of screenshotBlobs) {

            if (shouldSaveLocally) {
                let link = document.createElement("a");
                let url = URL.createObjectURL(blob);
                link.href = url;
                link.download = name;
                // needed so that handleElementClick can let it trickle down
                link.dataset.annotatorUi = "true";
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

    const takeScreenshot = ({ tab, shouldSaveLocally = false, shouldUpload = false, compress = false }) => {
        if (!tab) {
            throw new Error("Missing tab argument");
        }
        CaptureAPI.captureToFiles(
            tab,
            getFilename(tab.url),
            (blobs) => displayCaptures(blobs, shouldSaveLocally, shouldUpload, compress),
            errorHandler,
            updateProgress,
            splitNotifier
        );
    }

    return [id, takeScreenshot, screenshot, progress, splitted, error]
}

export default useScreenshot;