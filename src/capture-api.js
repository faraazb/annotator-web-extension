
const CaptureAPI = (function () {
    let SCREENSHOTS = [];
    let CAPTURE_DELAY = 600;
    let MAX_PRIMARY_DIMENSION = 15000 * 2;
    let MAX_SECONDARY_DIMENSION = 4000 * 2;
    let MAX_AREA = MAX_PRIMARY_DIMENSION * MAX_SECONDARY_DIMENSION;

    //
    // URL Matching test - to verify we can talk to this URL
    //

    let matches = ["http://*/*", "https://*/*", "ftp://*/*", "file://*/*"],
        noMatches = [/^https?:\/\/chrome.google.com\/.*$/];

    function isValidUrl(url) {
        // couldn't find a better way to tell if executeScript
        // wouldn't work -- so just testing against known urls
        // for now...
        let r, i;
        for (i = noMatches.length - 1; i >= 0; i--) {
            if (noMatches[i].test(url)) {
                return false;
            }
        }
        for (i = matches.length - 1; i >= 0; i--) {
            r = new RegExp("^" + matches[i].replace(/\*/g, ".*") + "$");
            if (r.test(url)) {
                return true;
            }
        }
        return false;
    }

    async function capture(data, screenshots, callback, splitnotifier) {
        const { ok, dataURI } = await chrome.runtime.sendMessage({ action: "CAPTURE_TAB", payload: { format: "png" } });
        if (ok && dataURI) {
            let image = new Image();
            image.onload = function () {
                data.image = { width: image.width, height: image.height };

                // given device mode emulation or zooming, we may end up with
                // a different sized image than expected, so let's adjust to
                // match it!
                if (data.windowWidth !== image.width) {
                    let scale = image.width / data.windowWidth;
                    data.x *= scale;
                    data.y *= scale;
                    data.totalWidth *= scale;
                    data.totalHeight *= scale;
                }

                // lazy initialization of screenshot canvases (since we need to wait
                // for actual image size)
                if (!screenshots.length) {
                    Array.prototype.push.apply(
                        screenshots,
                        _initScreenshots(data.totalWidth, data.totalHeight)
                    );
                    if (screenshots.length > 1) {
                        if (splitnotifier) {
                            splitnotifier();
                        }
                        // $("screenshot-count").innerText = screenshots.length;
                    }
                }

                // draw it on matching screenshot canvases
                _filterScreenshots(
                    data.x,
                    data.y,
                    image.width,
                    image.height,
                    screenshots
                ).forEach(function (screenshot) {
                    screenshot.ctx.drawImage(
                        image,
                        data.x - screenshot.left,
                        data.y - screenshot.top
                    );
                });
                // this is necessary, must wait for the image to load
                // before processing next arrangment, otherwise ss are broken
                // the callback is a call to processArrangments
                if (callback) {
                    callback();
                }
            };
            image.src = dataURI;
            // send back log data for debugging (but keep it truthy to
            // indicate success)
            return data || true;
        }
    }

    function _initScreenshots(totalWidth, totalHeight) {
        // Create and return an array of screenshot objects based
        // on the `totalWidth` and `totalHeight` of the final image.
        // We have to account for multiple canvases if too large,
        // because Chrome won't generate an image otherwise.
        //
        let badSize =
            totalHeight > MAX_PRIMARY_DIMENSION ||
            totalWidth > MAX_PRIMARY_DIMENSION ||
            totalHeight * totalWidth > MAX_AREA,
            biggerWidth = totalWidth > totalHeight,
            maxWidth = !badSize
                ? totalWidth
                : biggerWidth
                    ? MAX_PRIMARY_DIMENSION
                    : MAX_SECONDARY_DIMENSION,
            maxHeight = !badSize
                ? totalHeight
                : biggerWidth
                    ? MAX_SECONDARY_DIMENSION
                    : MAX_PRIMARY_DIMENSION,
            numCols = Math.ceil(totalWidth / maxWidth),
            numRows = Math.ceil(totalHeight / maxHeight),
            row,
            col,
            canvas,
            left,
            top;

        let canvasIndex = 0;
        let result = [];

        for (row = 0; row < numRows; row++) {
            for (col = 0; col < numCols; col++) {
                canvas = document.createElement("canvas");
                canvas.width =
                    col == numCols - 1 ? totalWidth % maxWidth || maxWidth : maxWidth;
                canvas.height =
                    row == numRows - 1 ? totalHeight % maxHeight || maxHeight : maxHeight;

                left = col * maxWidth;
                top = row * maxHeight;

                result.push({
                    canvas: canvas,
                    ctx: canvas.getContext("2d"),
                    index: canvasIndex,
                    left: left,
                    right: left + canvas.width,
                    top: top,
                    bottom: top + canvas.height,
                });

                canvasIndex++;
            }
        }

        return result;
    }

    function _filterScreenshots(
        imgLeft,
        imgTop,
        imgWidth,
        imgHeight,
        screenshots
    ) {
        // Filter down the screenshots to ones that match the location
        // of the given image.
        //
        let imgRight = imgLeft + imgWidth,
            imgBottom = imgTop + imgHeight;
        return screenshots.filter(function (screenshot) {
            return (
                imgLeft < screenshot.right &&
                imgRight > screenshot.left &&
                imgTop < screenshot.bottom &&
                imgBottom > screenshot.top
            );
        });
    }

    function getBlobs(screenshots) {
        return screenshots.map(function (screenshot) {
            let dataURI = screenshot.canvas.toDataURL();

            // convert base64 to raw binary data held in a string
            // doesn't handle URLEncoded DataURIs
            let byteString = atob(dataURI.split(",")[1]);

            // separate out the mime component
            let mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

            // write the bytes of the string to an ArrayBuffer
            let ab = new ArrayBuffer(byteString.length);
            let ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }

            // create a blob for writing to a file
            let blob = new Blob([ab], { type: mimeString });
            return blob;
        });
    }

    function _addFilenameSuffix(filename, index) {
        if (!index) {
            return filename;
        }
        let sp = filename.split(".");
        let ext = sp.pop();
        return sp.join(".") + "-" + (index + 1) + "." + ext;
    }

    function captureToBlobs(tab, callback, errback, progress, splitnotifier) {
        let loaded = false;
        let noop = function () { };

        callback = callback || noop;
        errback = errback || noop;
        progress = progress || noop;

        if (!isValidUrl(tab.url)) {
            errback("Invalid page - this page is not supported"); // TODO errors
        }

        loaded = true;
        progress(0);

        async function takeScreenshot(request, callback) {
            progress(request.complete);
            const result = await capture(request, SCREENSHOTS, callback, splitnotifier);
            return result;
        }

        // calculate positions and take screenshots
        getPositions(() => callback(getBlobs(SCREENSHOTS)), takeScreenshot);
    }

    function captureToFiles(
        tab,
        filename,
        callback,
        errback,
        progress,
        splitnotifier
    ) {
        captureToBlobs(
            tab,
            function (blobs) {
                const result = []
                if (blobs.length === 1) {
                    callback([{ blob: blobs[0], name: filename }])
                } else {
                    blobs.forEach((blob, index) => {
                        const blobFileName = _addFilenameSuffix(filename, index);
                        result.push({ blob: blob, name: blobFileName });
                    });
                    callback(result);
                }
            },
            errback,
            progress,
            splitnotifier
        );
    }

    function max(nums) {
        return Math.max.apply(
            Math,
            nums.filter(function (x) {
                return x;
            })
        );
    }

    function getDimensions() {
        let widths = [
            document.documentElement.clientWidth,
            body ? body.scrollWidth : 0,
            document.documentElement.scrollWidth,
            body ? body.offsetWidth : 0,
            document.documentElement.offsetWidth,
        ];
        let
            heights = [
                document.documentElement.clientHeight,
                body ? body.scrollHeight : 0,
                document.documentElement.scrollHeight,
                body ? body.offsetHeight : 0,
                document.documentElement.offsetHeight,
                // (Array.prototype.slice.call(document.getElementsByTagName('*'), 0)
                //  .reduce(function(val, elt) {
                //      let h = elt.offsetHeight; return h > val ? h : val;
                //  }, 0))
            ];
        return { fullWidth: max(widths), fullHeight: max(heights) };
    }

    function getPositions(callback, takeScreenshot) {
        preScreenshotCleanup();

        let body = document.body,
            originalBodyOverflowYStyle = body ? body.style.overflowY : "",
            originalX = window.scrollX,
            originalY = window.scrollY,
            originalOverflowStyle = document.documentElement.style.overflow;

        // try to make pages with bad scrolling work, e.g., ones with
        // `body { overflow-y: scroll; }` can break `window.scrollTo`
        if (body) {
            body.style.overflowY = "visible";
        }

        const { fullHeight, fullWidth } = getDimensions();

        let
            windowWidth = window.innerWidth,
            windowHeight = window.innerHeight,
            arrangements = [],
            // pad the vertical scrolling to try to deal with
            // sticky headers, 250 is an arbitrary size
            scrollPad = 200,
            yDelta = windowHeight - (windowHeight > scrollPad ? scrollPad : 0),
            xDelta = windowWidth,
            yPos = fullHeight - windowHeight,
            xPos,
            numArrangements;

        // During zooming, there can be weird off-by-1 types of things...
        if (fullWidth <= xDelta + 1) {
            fullWidth = xDelta;
        }

        // Disable all scrollbars. We'll restore the scrollbar state when we're done
        // taking the screenshots.
        document.documentElement.style.overflow = "hidden";

        while (yPos > -yDelta) {
            xPos = 0;
            while (xPos < fullWidth) {
                arrangements.push([xPos, yPos]);
                xPos += xDelta;
            }
            yPos -= yDelta;
        }


        // console.log("fullHeight", fullHeight, "fullWidth", fullWidth);
        // console.log("windowWidth", windowWidth, "windowHeight", windowHeight);
        // console.log("xDelta", xDelta, "yDelta", yDelta);
        let arText = [];
        arrangements.forEach(function (x) {
            arText.push("[" + x.join(",") + "]");
        });
        // console.log("arrangements", arText.join(", "));

        numArrangements = arrangements.length;

        function cleanUp() {
            document.documentElement.style.overflow = originalOverflowStyle;
            if (body) {
                body.style.overflowY = originalBodyOverflowYStyle;
            }
            window.scrollTo(originalX, originalY);
        }

        (function processArrangements() {
            if (!arrangements.length) {
                cleanUp();
                postScreenshotCleanup();
                if (callback) {
                    callback();
                }
                return;
            }

            let next = arrangements.shift(),
                x = next[0],
                y = next[1];

            window.scrollTo(x, y);

            let data = {
                msg: "capture",
                x: window.scrollX,
                y: window.scrollY,
                complete: (numArrangements - arrangements.length) / numArrangements,
                windowWidth: windowWidth,
                totalWidth: fullWidth,
                totalHeight: fullHeight,
                devicePixelRatio: window.devicePixelRatio,
            };

            // Need to wait for things to settle
            window.setTimeout(async function () {
                // In case the below function never returns, cleanup
                let cleanUpTimeout = window.setTimeout(cleanUp, 1250);

                const ok = await takeScreenshot(data, () => processArrangements());
                window.clearTimeout(cleanUpTimeout);
                if (!ok) {
                    cleanUp()
                }

            }, CAPTURE_DELAY);
        })();
    }

    function preScreenshotCleanup() {
        const styles = `
            .annotator-fix--sticky {
                position: relative !important;
                inset: auto !important;
            }
            
            .annotator-fix--fixed {
                position: absolute !important;
            }`;
        const style = document.createElement("style");
        style.id = "annotator-fixes"
        style.innerHTML = styles;
        document.body.appendChild(style);

        const elements = document.querySelectorAll("*");

        elements.forEach((element) => {
            const computedStyle = window.getComputedStyle(element);
            element.style.transition = "none";
            if (computedStyle.getPropertyValue("position") === "sticky") {
                element.classList.add("annotator-screenshot-fix", "annotator-fix--sticky");
                // element.style.position = "relative";
                // element.style.inset = "auto";
            } else if (computedStyle.getPropertyValue("position") === "fixed") {
                element.classList.add("annotator-screenshot-fix", "annotator-fix--fixed");
                // element.style.position = "absolute";
            }
        });
    }

    function postScreenshotCleanup() {
        const style = document.getElementById("annotator-fixes");
        style.remove();
        const elements = document.querySelectorAll(".annotator-screenshot-fix");
        elements.forEach((element) => {
            element.classList.remove("annotator-screenshot-fix", "annotator-fix--sticky", "annotator-fix--fixed");
        });
    }


    return {
        captureToBlobs,
        captureToFiles,
        getDimensions
    };
})();

export default CaptureAPI;
