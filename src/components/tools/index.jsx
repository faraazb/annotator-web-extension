import { useEffect, useState } from "preact/hooks";
import Draggable from "react-draggable";
import { usePopper } from "react-popper";
import useScreenshot from "../../hooks/use-screenshot";
import { exitInspectorMode, startInspectorMode } from "../../lib/annotate";
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
    // TODO use a store like Teaful
    const [selectedTool, setSelectedTool] = useState(3);
    const [open, setOpen] = useState(true);
    const [screenshotMenuOpen, setScreenshotMenuOpen] = useState(false);
    const [takeScreenshot, progress, splitted, error] = useScreenshot();

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

    const takeFullPageScreenshot = async () => {
        // disable pointer events to prevent hover styles
        document.body.style.pointerEvents = "none";

        // stop element inspector
        exitInspectorMode();

        setOpen(false);
        const { ok, tabs } = await chrome.runtime.sendMessage({
            action: "QUERY_TABS",
            payload: { active: true, currentWindow: true },
        });
        if (ok) {
            await takeScreenshot({ tab: tabs[0] });
        }
        startInspectorMode();
    };

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
        document.body.addEventListener("mouseenter", () =>
            setScreenshotMenuOpen(false)
        );

        return () => {
            document.body.removeEventListener("mouseenter", () =>
                setScreenshotMenuOpen(false)
            );
        };
    }, []);

    useEffect(() => {
        console.log(progress);
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
                                                onClick={takeFullPageScreenshot}
                                            >
                                                <span className="ss-menu-button__icon">
                                                    <Download />
                                                </span>
                                                Save locally
                                            </button>
                                        </li>
                                        <li className="screenshot-sub-menu__item">
                                            <button className="ss-menu-button">
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
