const cached = new WeakMap();

export function isEqual(a, b) {
    if (a === null || b === null) {
        return a === b;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
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
    if (Array.isArray(data)) return 'array';
    return 'object';
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
        children.forEach(child => {
            let childObj = generateHTMLStructure(child);
            Object.keys(childObj).forEach(key => {
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

export function findSimilarElements(element, levels = 10) {
    let current_element = element;
    let same_structure_elements = [];

    if (element.children.length === 0) {
        return same_structure_elements;
    }


    for (let level = 0; level < levels; level++) {
        let temp_next_element = current_element;
        let temp_prev_element = current_element;

        while (temp_next_element.nextElementSibling) {
            let next_element = temp_next_element.nextElementSibling;
            let next_element_structure = generateHTMLStructure(next_element);
            let element_structure = generateHTMLStructure(temp_next_element);

            if (isEqual(element_structure, next_element_structure)) {
                if (next_element.tagName.toLowerCase() === 'script' || next_element.tagName.toLowerCase() === 'style') {
                    continue;
                }
                same_structure_elements.push(next_element);
            }

            temp_next_element = next_element;
        }


        while (temp_prev_element.previousElementSibling) {
            let prev_element = temp_prev_element.previousElementSibling;
            let prev_element_structure = generateHTMLStructure(prev_element);
            let element_structure = generateHTMLStructure(temp_prev_element);

            if (isEqual(element_structure, prev_element_structure)) {
                if (prev_element.tagName.toLowerCase() === 'script' || prev_element.tagName.toLowerCase() === 'style') {
                    continue;
                }
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
