import { useEffect, useState } from "preact/hooks";
import Draggable from "react-draggable";
import { usePopper } from "react-popper";
import { createAnnotation } from "../../api";
import useScreenshot from "../../hooks/use-screenshot";
import { exitInspectorMode, startInspectorMode } from "../../lib/annotate";
import { useStore } from "../../store";
import { blobToDataURL } from "../../utils/blob";
import {
    Camera,
    Download,
    DragHandle,
    Save,
    Screenshot,
    SendPlane,
    Spline,
} from "../icons";
import "./tools.css";

const Tools = () => {
    const [user, setUser] = useStore.user();
    const [selectedTool, setSelectedTool] = useState(3);
    const [open, setOpen] = useStore.toolsOpen();
    const [screenshotMenuOpen, setScreenshotMenuOpen] = useState(false);
    const [
        screenshotId,
        takeScreenshot,
        screenshot,
        progress,
        splitted,
        error,
    ] = useScreenshot();
    const [upload, setUpload] = useState(false);

    const [referenceElement, setReferenceElement] = useState(null);
    const [popperElement, setPopperElement] = useState(null);
    const [arrowElement, setArrowElement] = useState(null);
    const { styles, attributes } = usePopper(referenceElement, popperElement, {
        placement: "right",
        modifiers: [
            { name: "offset", options: { offset: [20, 12] } },
            { name: "arrow", options: { element: arrowElement } },
            {
                name: "flip",
                options: { fallbackPlacements: ["left", "right"] },
            },
        ],
    });

    useEffect(() => {
        (async function () {
            // just for extra precaution as once the popup loads, user is
            // going to be present in the teaful store
            if (!user) {
                const { user } = await chrome.storage.local.get("user");
                if (user) {
                    setUser(user);
                }
            }
        })();
        document.body.addEventListener("mouseenter", () =>
            setScreenshotMenuOpen(false)
        );

        return () => {
            document.body.removeEventListener("mouseenter", () =>
                setScreenshotMenuOpen(false)
            );
        };
    }, []);

    const takeFullPageScreenshot = async (
        shouldSaveLocally = true,
        shouldUpload = false
    ) => {
        setUpload(shouldUpload);
        // disable pointer events to prevent hover styles
        document.body.style.pointerEvents = "none";

        // stop element inspector
        exitInspectorMode();

        // hide tools menu
        setOpen(false);
        setScreenshotMenuOpen(false);

        const { ok, tabs } = await chrome.runtime.sendMessage({
            action: "QUERY_TABS",
            payload: { active: true, currentWindow: true },
        });
        if (ok) {
            // TODO the screenshot blob/file simply can't be returned here
            // because everything in the capture-api is callback based
            await takeScreenshot({
                tab: tabs[0],
                shouldSaveLocally,
                shouldUpload,
            });
        }
        // this creates problem
        // startInspectorMode();
    };

    useEffect(() => {
        if (screenshot) {
            startInspectorMode();
        }
        (async function () {
            if (screenshot && upload) {
                // TODO:Raj change this from localstorage
                const labels = [
                    {
                        title: "Hello",
                        x: 4,
                        y: 7,
                        width: 20,
                        height: 10,
                    },
                    {
                        title: "Hello World",
                        x: 4,
                        y: 7,
                        width: 20,
                        height: 10,
                    },
                ];
                // TODO IMPORTANT screenshot is an array of blobs, since screenshot can be split
                // in multiple files
                const result = await chrome.runtime.sendMessage({
                    action: "CREATE_ANNOTATION",
                    payload: {
                        screenshotURL: await blobToDataURL(screenshot[0].blob),
                        name: screenshot[0].name,
                        annotations: labels,
                        email: user.email,
                    },
                });
                // TODO show a toast notification? when successful
                // if (result.ok) {

                // }
            }
        })();
    }, [screenshot]);

    const tools = [
        { id: 3, Icon: <Spline /> },
        {
            id: 4,
            Icon: <Camera />,
            styles: { cursor: "default" },
            onClick: () => {},
            ref: setReferenceElement,
            onMouseOver: () => setScreenshotMenuOpen(true),
            onMouseLeave: () => setScreenshotMenuOpen(false),
        },
    ];

    useEffect(() => {
        // console.log(progress);
        if (progress === 1) {
            setOpen(true);
            document.body.style.pointerEvents = "auto";
        }
    }, [progress]);

    return (
        <>
            {open && (
                <Draggable handle="#annotator-drag-handle" bounds="body">
                    <div
                        id="annotator-tools"
                        className={"annotator-panel"}
                        tabIndex={-1}
                    >
                        <div id="annotator-drag-handle" className="drag-handle">
                            <span className="panel-drag-handle">
                                <DragHandle transform={"rotate(90)"} />
                            </span>
                        </div>
                        <div className="annotator-tools__buttons">
                            {tools.map(
                                ({
                                    id,
                                    Icon,
                                    onClick,
                                    ref,
                                    onMouseOver,
                                    onMouseLeave,
                                    styles = {},
                                }) => {
                                    return (
                                        <button
                                            ref={ref}
                                            onMouseEnter={onMouseOver}
                                            // onMouseLeave={onMouseLeave}
                                            tabIndex={-1}
                                            key={`annotator-tool-${id}`}
                                            className={`tool-button${
                                                id === selectedTool
                                                    ? " " +
                                                      "tool-button--selected"
                                                    : ""
                                            }`}
                                            onClick={
                                                onClick ||
                                                (() => {
                                                    setSelectedTool(id);
                                                })
                                            }
                                            style={styles}
                                        >
                                            <span className="tool-button__icon">
                                                {Icon}
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                        {screenshotMenuOpen && (
                            <div
                                id="annotator-screenshot-menu"
                                ref={setPopperElement}
                                style={styles.popper}
                                {...attributes.popper}
                            >
                                <div
                                    ref={setArrowElement}
                                    style={styles.arrow}
                                    id="annotator-screenshot-menu-arrow"
                                />
                                <div
                                    className="screenshot-sub-menu-hover"
                                    onMouseEnter={() =>
                                        setScreenshotMenuOpen(true)
                                    }
                                ></div>
                                <menu
                                    className="screenshot-sub-menu"
                                    onMouseLeave={() =>
                                        setScreenshotMenuOpen(false)
                                    }
                                >
                                    <ul className="screenshot-sub-menu__items">
                                        <li className="screenshot-sub-menu__item">
                                            <button
                                                className="ss-menu-button"
                                                onClick={() =>
                                                    takeFullPageScreenshot()
                                                }
                                            >
                                                <span className="ss-menu-button__icon">
                                                    <Download />
                                                </span>
                                                Save locally
                                            </button>
                                        </li>
                                        <li className="screenshot-sub-menu__item">
                                            <button
                                                className="ss-menu-button"
                                                onClick={() =>
                                                    takeFullPageScreenshot(
                                                        false,
                                                        true
                                                    )
                                                }
                                            >
                                                <span className="ss-menu-button__icon">
                                                    <SendPlane />
                                                </span>
                                                Send to server
                                            </button>
                                        </li>
                                    </ul>
                                </menu>
                            </div>
                        )}
                    </div>
                </Draggable>
            )}
        </>
    );
};

export default Tools;
