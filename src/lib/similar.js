const cached = new WeakMap();

export function isEqual(a, b) {
    if (a === null || b === null) {
        return a === b;
    }

    if (typeof a !== "object" || typeof b !== "object") {
        return a === b;
    }

    const dataTypeA = detectDataType(a);
    const dataTypeB = detectDataType(b);
    if (dataTypeA !== dataTypeB) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    const symbolsA = Object.getOwnPropertySymbols(a);
    const symbolsB = Object.getOwnPropertySymbols(b);
    if (symbolsA.length !== symbolsB.length) return false;

    if (cached.get(a)?.has(b)) return true;
    if (cached.get(b)?.has(a)) return true;

    cache(a, b, cached);

    const propertyNamesA = [...keysA, ...symbolsA];

    for (const propertyNameA of propertyNamesA) {
        if (!b.hasOwnProperty(propertyNameA)) return false;

        const propertyValueA = a[propertyNameA];
        const propertyValueB = b[propertyNameA];

        if (!isEqual(propertyValueA, propertyValueB)) {
            return false;
        }
    }

    return true;
}

function detectDataType(data) {
    if (Array.isArray(data)) return "array";
    return "object";
}

function cache(a, b, cached) {
    let setForA = cached.get(a);
    if (!setForA) {
        cached.set(a, (setForA = new Set()));
    }
    setForA.add(b);

    let setForB = cached.get(b);
    if (!setForB) {
        cached.set(b, (setForB = new Set()));
    }
    setForB.add(a);
}

function generateHTMLStructure(element) {
    let tagName = element.tagName.toLowerCase();
    let children = Array.from(element.children);
    let obj = {};
    if (children.length > 0) {
        obj[tagName] = {};
        children.forEach((child) => {
            let childObj = generateHTMLStructure(child);
            Object.keys(childObj).forEach((key) => {
                if (!obj[tagName][key]) {
                    obj[tagName][key] = childObj[key];
                } else if (Array.isArray(obj[tagName][key])) {
                    obj[tagName][key].push(childObj[key]);
                } else {
                    obj[tagName][key] = [obj[tagName][key], childObj[key]];
                }
            });
        });
    } else {
        obj[tagName] = null;
    }
    return obj;
}

export function findSimilarElements(element) {
    let className = element.getAttribute("class") || "";

    if (className.trim() === "") {
        if (element.children.length === 0) {
            let parent_similar_elements = findSimilarElementsLegacy(element, 10, true);
            let to_return = [];
            let current_element_structure = generateHTMLStructure(element);

            if (parent_similar_elements.length > 0) {
                parent_similar_elements.forEach((parent_element) => {
                    let res = find_element_with_structure(parent_element, current_element_structure);
                    if (res) {
                        to_return.push(res);
                    }
                });
            }
            return to_return;
        } else {
            return [];
        }
    }

    let same_structure_elements = document.getElementsByClassName(className);

    return [...same_structure_elements];
}

export function find_element_with_structure(element, structure) {
    let children = Array.from(element.children);

    for (let i = 0; i < children.length; i++) {
        let child = children[i];

        // last child
        if (child.children.length === 0) {
            if (child.tagName.toLowerCase() === Object.keys(structure)[0]) {
                return child;
            } else {
                return null;
            }
        } else {
            let res = find_element_with_structure(child, structure);
            if (res) {
                return res;
            }
        }
    }

}

export function findSimilarElementsLegacy(element, levels = 10, single_elements_search = false) {
    let current_element = element;
    let same_structure_elements = [];

    if (!single_elements_search && element.children.length === 0) {
        return same_structure_elements;
    }

    for (let level = 0; level < levels; level++) {
        let temp_next_element = current_element;
        let temp_prev_element = current_element;

        while (temp_next_element.nextElementSibling) {
            let next_element = temp_next_element.nextElementSibling;

            if (ignoreElement(next_element)) {
                temp_next_element = next_element;
                continue;
            }

            let next_element_structure = generateHTMLStructure(next_element);
            let element_structure = generateHTMLStructure(temp_next_element);

            if (isEqual(element_structure, next_element_structure)) {
                same_structure_elements.push(next_element);
            }

            temp_next_element = next_element;
        }

        while (temp_prev_element.previousElementSibling) {
            let prev_element = temp_prev_element.previousElementSibling;

            if (ignoreElement(prev_element)) {
                temp_prev_element = prev_element;
                continue;
            }

            let prev_element_structure = generateHTMLStructure(prev_element);
            let element_structure = generateHTMLStructure(temp_prev_element);

            if (isEqual(element_structure, prev_element_structure)) {
                same_structure_elements.unshift(prev_element);
            }

            temp_prev_element = prev_element;
        }

        if (same_structure_elements.length > 0) {
            break; // exit loop if matching elements are found
        } else if (temp_next_element.parentElement) {
            current_element = current_element.parentElement; // move to next level
        } else {
            break; // exit loop if no more levels to check
        }
    }

    return same_structure_elements;
}

function ignoreElement(element) {
    let ignored_tags = ["script", "style", "link", "html", "body", "head"];

    if (ignored_tags.includes(element.tagName.toLowerCase())) {
        return true;
    }

    return false;
}
