// https://github.com/facebook/react

const nodeToData = new Map(); // How long the rect should be shown for?

const DISPLAY_DURATION = 250; // What's the longest we are willing to show the overlay for?
// This can be important if we're getting a flurry of events (e.g. scroll update).

const MAX_DISPLAY_DURATION = 3000; // How long should a rect be considered valid for?

const REMEASUREMENT_AFTER_DURATION = 250; // Some environments (e.g. React Native / Hermes) don't support the performace API yet.

const getCurrentTime =
    typeof performance === "object" && typeof performance.now === "function"
        ? () => performance.now()
        : () => Date.now();
let agent = null;
let drawAnimationFrameID = null;
let isEnabled = true;
let redrawTimeoutID = null;
const OUTLINE_COLOR = "#f0f0f0"; // Note these colors are in sync with DevTools Profiler chart colors.

const COLORS = [
    "#37afa9",
    "#63b19e",
    "#80b393",
    "#97b488",
    "#abb67d",
    "#beb771",
    "#cfb965",
    "#dfba57",
    "#efbb49",
    "#febc38",
];
let canvas = null;

function draw(nodeToData) {
    if (canvas === null) {
        initialize();
    }

    const canvasFlow = canvas;
    canvasFlow.width = window.screen.availWidth;
    canvasFlow.height = window.screen.availHeight;
    const context = canvasFlow.getContext("2d");
    context.clearRect(0, 0, canvasFlow.width, canvasFlow.height);
    nodeToData.forEach(({ count, rect }) => {
        if (rect !== null) {
            const colorIndex = Math.min(COLORS.length - 1, count - 1);
            const color = COLORS[colorIndex];
            drawBorder(context, rect, color);
        }
    });
}

function drawBorder(context, rect, color) {
    const { height, left, top, width } = rect; // outline

    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left - 1, top - 1, width + 2, height + 2); // inset

    context.lineWidth = 1;
    context.strokeStyle = OUTLINE_COLOR;
    context.strokeRect(left + 1, top + 1, width - 1, height - 1);
    context.strokeStyle = color;
    context.setLineDash([0]); // border

    context.lineWidth = 1;
    context.strokeRect(left, top, width - 1, height - 1);
    context.setLineDash([0]);
}

function destroy() {
    if (canvas !== null) {
        if (canvas.parentNode != null) {
            canvas.parentNode.removeChild(canvas);
        }

        canvas = null;
    }
}

function initialize() {
    canvas = window.document.createElement("canvas");
    canvas.style.cssText = `
    xx-background-color: red;
    xx-opacity: 0.5;
    bottom: 0;
    left: 0;
    pointer-events: none;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 1000000000;
  `;
    const root = window.document.documentElement;
    root.insertBefore(canvas, root.firstChild);
    console.log(canvas);
}

function measureNode(node) {
    if (!node || typeof node.getBoundingClientRect !== "function") {
        return null;
    }

    let currentWindow = window.__REACT_DEVTOOLS_TARGET_WINDOW__ || window;
    return getNestedBoundingClientRect(node, currentWindow);
}

function prepareToDraw() {
    drawAnimationFrameID = null;
    redrawTimeoutID = null;
    const now = getCurrentTime();
    let earliestExpiration = Number.MAX_VALUE; // Remove any items that have already expired.

    nodeToData.forEach((data, node) => {
        if (data.expirationTime < now) {
            nodeToData.delete(node);
        } else {
            earliestExpiration = Math.min(
                earliestExpiration,
                data.expirationTime,
            );
        }
    });
    draw(nodeToData);
    redrawTimeoutID = setTimeout(prepareToDraw, earliestExpiration - now);
}

function traceUpdates(nodes) {
    if (!isEnabled) {
        return;
    }

    nodes.forEach(node => {
        const data = nodeToData.get(node);
        const now = getCurrentTime();
        let lastMeasuredAt = data != null ? data.lastMeasuredAt : 0;
        let rect = data != null ? data.rect : null;

        if (
            rect === null ||
            lastMeasuredAt + REMEASUREMENT_AFTER_DURATION < now
        ) {
            lastMeasuredAt = now;
            rect = measureNode(node);
        }

        nodeToData.set(node, {
            count: data != null ? data.count + 1 : 1,
            expirationTime:
                data != null
                    ? Math.min(
                          now + MAX_DISPLAY_DURATION,
                          data.expirationTime + DISPLAY_DURATION,
                      )
                    : now + DISPLAY_DURATION,
            lastMeasuredAt,
            rect,
        });
    });

    if (redrawTimeoutID !== null) {
        clearTimeout(redrawTimeoutID);
        redrawTimeoutID = null;
    }

    if (drawAnimationFrameID === null) {
        drawAnimationFrameID = requestAnimationFrame(prepareToDraw);
    }
} // Get the window object for the document that a node belongs to,
// or return null if it cannot be found (node not attached to DOM,
// etc).

function getOwnerWindow(node) {
    if (!node.ownerDocument) {
        return null;
    }

    return node.ownerDocument.defaultView;
} // Get the iframe containing a node, or return null if it cannot
// be found (node not within iframe, etc).

function getOwnerIframe(node) {
    const nodeWindow = getOwnerWindow(node);

    if (nodeWindow) {
        return nodeWindow.frameElement;
    }

    return null;
} // Get a bounding client rect for a node, with an
// offset added to compensate for its border.

function getBoundingClientRectWithBorderOffset(node) {
    const dimensions = getElementDimensions(node);
    return mergeRectOffsets([
        node.getBoundingClientRect(),
        {
            top: dimensions.borderTop,
            left: dimensions.borderLeft,
            bottom: dimensions.borderBottom,
            right: dimensions.borderRight,
            // This width and height won't get used by mergeRectOffsets (since this
            // is not the first rect in the array), but we set them so that this
            // object typechecks as a ClientRect.
            width: 0,
            height: 0,
        },
    ]);
} // Add together the top, left, bottom, and right properties of
// each ClientRect, but keep the width and height of the first one.

function mergeRectOffsets(rects) {
    return rects.reduce((previousRect, rect) => {
        if (previousRect == null) {
            return rect;
        }

        return {
            top: previousRect.top + rect.top,
            left: previousRect.left + rect.left,
            width: previousRect.width,
            height: previousRect.height,
            bottom: previousRect.bottom + rect.bottom,
            right: previousRect.right + rect.right,
        };
    });
} // Calculate a boundingClientRect for a node relative to boundaryWindow,
// taking into account any offsets caused by intermediate iframes.

function getNestedBoundingClientRect(node, boundaryWindow) {
    const ownerIframe = getOwnerIframe(node);

    if (ownerIframe && ownerIframe !== boundaryWindow) {
        const rects = [node.getBoundingClientRect()];
        let currentIframe = ownerIframe;
        let onlyOneMore = false;

        while (currentIframe) {
            const rect = getBoundingClientRectWithBorderOffset(currentIframe);
            rects.push(rect);
            currentIframe = getOwnerIframe(currentIframe);

            if (onlyOneMore) {
                break;
            } // We don't want to calculate iframe offsets upwards beyond
            // the iframe containing the boundaryWindow, but we
            // need to calculate the offset relative to the boundaryWindow.

            if (
                currentIframe &&
                getOwnerWindow(currentIframe) === boundaryWindow
            ) {
                onlyOneMore = true;
            }
        }

        return mergeRectOffsets(rects);
    } else {
        return node.getBoundingClientRect();
    }
}

function getElementDimensions(domElement) {
    const calculatedStyle = window.getComputedStyle(domElement);
    return {
        borderLeft: parseInt(calculatedStyle.borderLeftWidth, 10),
        borderRight: parseInt(calculatedStyle.borderRightWidth, 10),
        borderTop: parseInt(calculatedStyle.borderTopWidth, 10),
        borderBottom: parseInt(calculatedStyle.borderBottomWidth, 10),
        marginLeft: parseInt(calculatedStyle.marginLeft, 10),
        marginRight: parseInt(calculatedStyle.marginRight, 10),
        marginTop: parseInt(calculatedStyle.marginTop, 10),
        marginBottom: parseInt(calculatedStyle.marginBottom, 10),
        paddingLeft: parseInt(calculatedStyle.paddingLeft, 10),
        paddingRight: parseInt(calculatedStyle.paddingRight, 10),
        paddingTop: parseInt(calculatedStyle.paddingTop, 10),
        paddingBottom: parseInt(calculatedStyle.paddingBottom, 10),
    };
}

function drawBoxAroundElement(...elements) {
    traceUpdates(elements);
}

window.startHighlightUpdates = () => {
    initialize();

    let nodesUpdatedThisTick = [];
    let nextTickTimeout;
    window.onNodeUpdate = node => {
        nodesUpdatedThisTick.push(node);
        if (nextTickTimeout) {
            clearTimeout(nextTickTimeout);
        }
        nextTickTimeout = setTimeout(() => {
            drawBoxAroundElement(
                ...nodesUpdatedThisTick.map(node =>
                    node instanceof Text ? node.parentElement : node,
                ),
            );
            nodesUpdatedThisTick = [];
        }, 0);
    };
};
