import { useState } from "preact/hooks";
import Draggable from "react-draggable";
import {
    DragHandle,
    Screenshot,
    Spline,
} from "../icons";
import "./tools.css";


// probably define this in a store like Teaful, etc.
// switch tools using the store
// The store can be used in different components in
// that can be in different parts of the document
const tools = [
    { id: 3, Icon: <Spline /> },
    { id: 4, Icon: <Screenshot />, onClick: () => (console.log("Taking screenshot")) },
];

const Tools = () => {
    // TODO use a store like Teaful
    const [selectedTool, setSelectedTool] = useState(3);

    return (
        <Draggable handle="#annotator-drag-handle" bounds="body">
            <div id="annotator-tools" className={"annotator-panel"} tabIndex={-1}>
                <div id="annotator-drag-handle" className="drag-handle">
                    <span className="panel-drag-handle">
                        <DragHandle transform={"rotate(90)"} />
                    </span>
                </div>
                {tools.map(({ id, Icon, onClick }) => {
                    return (
                        <button
                            tabIndex={-1}
                            key={`annotator-tool-${id}`}
                            className={`tool-button${
                                id === selectedTool
                                    ? " " + "tool-button--selected"
                                    : ""
                            }`}
                            onClick={onClick || (() => {
                                document.activeElement.blur();
                                setSelectedTool(id)
                            })}
                        >
                            <span className="tool-button__icon">{Icon}</span>
                        </button>
                    );
                })}
            </div>
        </Draggable>
    );
};

export default Tools;
