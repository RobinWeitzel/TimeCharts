import style from './index.css';

/**
 * A module to visualize time-related data.
 * @module TimeCharts
 */

///// PRIVATE HELPERS /////

/**
 * Sets multiple attributes for a dom element.
 * @private
 * @param {Object} obj - the dom element
 * @param {Object} params - the attributes to be set
 */
function setAttributes(obj, params) {
    for (const [key, value] of Object.entries(params)) {
        if (key === "class") {
            obj.classList.add(...value);
        } else {
            obj.setAttribute(key, value);
        }
    }
}

/**
 * Removes all child elements from a DOM element.
 * @private
 * @param {Object} obj - the dom element
 */
function clear(obj) {
    while (obj.firstChild) {
        obj.removeChild(obj.firstChild);
    }
}


/**
 * Merges an object into another one.
 * @private
 * @param {Object} obj - the object into which to merge 
 * @param {Object} merger - the object to merge 
 * @param {boolean} [overwrite = false] - whether to overwrite the original value of it exists
 */
function mergeObjects(obj, merger, overwrite) {
    overwrite = overwrite === true; // defaults to false

    for (let key of Object.keys(merger)) {
        if (!(key in obj)) {
            obj[key] = merger[key];
        } else if (typeof merger[key] === "object") {
            mergeObjects(obj[key], merger[key], overwrite);
        } else if (overwrite) {
            obj[key] = merger[key];
        }
    }
}

/**
 * Generates coordinates for arcs based on the center position, the radius and the angle
 * @param {number} centerX - the x-coordinate of the center
 * @param {number} centerY - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} angleInDegrees - the angle
 */
function polarToCartesian(centerX, centerY, radiusX, radiusY, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

    return {
        x: centerX + (radiusX * Math.cos(angleInRadians)),
        y: centerY + (radiusY * Math.sin(angleInRadians))
    };
}

/**
 * Creates the svg path string for an arc
 * @param {number} x - the x-coordinate of the center
 * @param {number} y - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} startAngle - the angle at which the arc starts
 * @param {number} endAngle - the angle at which the arc ends
 * @param {number} outerArc - the flag for the outer arc
 */
function describeArc(x, y, radiusX, radiusY, startAngle, endAngle, outerArc) {
    const start = polarToCartesian(x, y, radiusX, radiusY, endAngle);
    const end = polarToCartesian(x, y, radiusX, radiusY, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    const d = [
        "M", start.x, start.y,
        "A", radiusX, radiusY, 0, largeArcFlag, outerArc, end.x, end.y
    ].join(" ");

    return [d, start, end];
}

/**
 * Creates the svg path string for the top circle/arc of a bar
 * @param {number} x - the x-coordinate of the center
 * @param {number} y - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} heightDelta - the height of the arc (not the height of the bar i.e. must be <= radiusY - heightOld)
 * @param {number} heightOld - the old height (where the arc should start)
 */
function createTopArc(x, y, radiusX, radiusY, heightDelta, heightOld) {
    // Calculate degrees
    const alphaOld = Math.asin((radiusY - heightOld) / radiusY) / Math.PI * 180;
    const alphaNew = Math.asin((radiusY - (heightOld + heightDelta)) / radiusY)  / Math.PI * 180;
    
    const arc1 = describeArc(x, y, radiusX, radiusY, alphaOld, alphaNew, 1);
    const arc2 = describeArc(x, y, radiusX, radiusY, 360-alphaOld, 360-alphaNew, 0);
  
    const d = [
        arc1[0],
        "L", arc2[2].x, arc2[2].y,
        arc2[0],
        "L", arc1[1].x, arc1[1].y,
    ].join(" ");
  
  return d;
}

/**
 * Creates the svg path string for the right circle/arc of a bar
 * @param {number} x - the x-coordinate of the center
 * @param {number} y - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} widthDelta - the width of the arc (not the height of the bar i.e. must be <= radiusX - widthOld)
 * @param {number} widthOld - the old width (where the arc should start)
 */
function createRightArc(x, y, radiusX, radiusY, widthDelta, widthOld) {
    // Calculate degrees
    const alphaOld = Math.asin((radiusX - widthOld) / radiusX) / Math.PI * 180;
    const alphaNew = Math.asin((radiusX - (widthOld + widthDelta)) / radiusX)  / Math.PI * 180;
    
    const arc1 = describeArc(x, y, radiusX, radiusY, 90+alphaOld, 90+alphaNew, 1);
    const arc2 = describeArc(x, y, radiusX, radiusY, 90+360-alphaOld, 90+360-alphaNew, 0);
  
    const d = [
        arc1[0],
        "L", arc2[2].x, arc2[2].y,
        arc2[0],
        "L", arc1[1].x, arc1[1].y,
    ].join(" ");
  
  return d;
}

/**
 * Creates the svg path string for the bottom circle/arc of a bar
 * @param {number} x - the x-coordinate of the center
 * @param {number} y - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} heightDelta - the height of the arc (not the height of the bar i.e. must be <= radiusY - heightOld)
 * @param {number} heightOld - the old height (where the arc should start)
 */
function createBottomArc(x, y, radiusX, radiusY, heightDelta, heightOld) {
    // Calculate degrees
    const alphaOld = Math.acos((radiusY - heightOld) / radiusY) / Math.PI * 180;
    const alphaNew = Math.acos((radiusY - (heightOld + heightDelta)) / radiusY)  / Math.PI * 180;
    
    const arc1 = describeArc(x, y, radiusX, radiusY, 180+alphaOld, 180+alphaNew, 0);
    const arc2 = describeArc(x, y, radiusX, radiusY, 180-alphaOld, 180-alphaNew, 1);
  
    const d = [
        arc1[0],
        "L", arc2[2].x, arc2[2].y,
        arc2[0],
        "L", arc1[1].x, arc1[1].y,
    ].join(" ");
  
  return d;
}

/**
 * Creates the svg path string for the left circle/arc of a bar
 * @param {number} x - the x-coordinate of the center
 * @param {number} y - the y-coordinate of the center
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} widthDelta - the width of the arc (not the height of the bar i.e. must be <= radiusX - widthOld)
 * @param {number} widthOld - the old width (where the arc should start)
 */
function createLeftArc(x, y, radiusX, radiusY, widthDelta, widthOld) {
    // Calculate degrees
    const alphaOld = Math.acos((radiusX - widthOld) / radiusX) / Math.PI * 180;
    const alphaNew = Math.acos((radiusX - (widthOld + widthDelta)) / radiusX)  / Math.PI * 180;
    
    const arc1 = describeArc(x, y, radiusX, radiusY, 90+180+alphaOld, 90+180+alphaNew, 0);
    const arc2 = describeArc(x, y, radiusX, radiusY, 90+180+360-alphaOld, 90+180+360-alphaNew, 1);
  
    const d = [
        arc1[0],
        "L", arc2[2].x, arc2[2].y,
        arc2[0],
        "L", arc1[1].x, arc1[1].y,
    ].join(" ");
  
  return d;
}

/**
 * Creates the svg path string for a vertical bar
 * @param {number} x - x-coordinate of the left side of the bar
 * @param {number} y - y-coordinate of the bottom side of the bar
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} heightDelta - the height of the bar-portion
 * @param {number} heightOld - the height where the bar-portion should start
 * @param {number} heightMax - the full height of the bar chart
 */
function createVerticalBar(x, y, radiusX, radiusY, heightDelta, heightOld, heightMax) {
    let bottomArcHeight = 0;
    let bottomArc = "";
    
    if(heightOld < radiusY) { // Bar starts in the bottom circle
        bottomArcHeight = Math.min(heightDelta, radiusY - heightOld);
        bottomArc = createBottomArc(x + radiusX, y - radiusY, radiusX, radiusY, bottomArcHeight, heightOld);
    } 

    let topArcHeight = 0;
    let topArc = "";

    if(heightOld + heightDelta > heightMax - radiusY) { // Bar ends in the top circle
        topArcHeight = Math.min(heightDelta, (heightOld + heightDelta) - (heightMax - radiusY));
        topArc = createTopArc(x + radiusX, y - heightMax + radiusY, radiusX, radiusY, topArcHeight, Math.max(0, heightOld - (heightMax - radiusY)));
    }

    let middleHeight = heightDelta - bottomArcHeight - topArcHeight;
    let middle = "";
    if(middleHeight > 0){
        middle = [
            "M", x, y - heightOld - bottomArcHeight,
            "v", -middleHeight,
            "h", radiusX * 2,
            "v", middleHeight,
            "h", -radiusX * 2,
        ].join(" ");
    }

    const d = [
        bottomArc,
        middle,
        topArc
    ].join(" ");

    return d;
}

/**
 * Creates the svg path string for a horizontal bar
 * @param {number} x - x-coordinate of the left side of the bar
 * @param {number} y - y-coordinate of the top side of the bar
 * @param {number} radiusX - the x-radius
 * @param {number} radiusY - the y-radius
 * @param {number} widthDelta - the width of the bar-portion
 * @param {number} widthOld - the width where the bar-portion should start
 * @param {number} widthMax - the full width of the bar chart
 */
function createHorizontalBar(x, y, radiusX, radiusY, widthDelta, widthOld, widthMax) {
    let leftArcWidth = 0;
    let leftArc = "";
    
    if(widthOld < radiusX) { // Bar starts in the left circle
        leftArcWidth = Math.min(widthDelta, radiusX - widthOld);
        leftArc = createLeftArc(x + radiusX, y + radiusY, radiusX, radiusY, leftArcWidth, widthOld);
    } 

    let rightArcWidth = 0;
    let rightArc = "";

    if(widthOld + widthDelta > widthMax - radiusX) { // Bar ends in the top circle
        rightArcWidth = Math.min(widthDelta, (widthOld + widthDelta) - (widthMax - radiusX));
        rightArc = createRightArc(x + widthMax - radiusX, y + radiusY, radiusX, radiusY, rightArcWidth, Math.max(0, widthOld - (widthMax - radiusX)));
    }

    let middleWidth = widthDelta - leftArcWidth - rightArcWidth;
    let middle = "";
    if(middleWidth > 0){
        middle = [
            "M", x + widthOld + leftArcWidth, y,
            "h", middleWidth,
            "v", radiusY * 2,
            "h", -middleWidth,
            "v", -radiusY * 2,
        ].join(" ");
    }

    const d = [
        leftArc,
        middle,
        rightArc
    ].join(" ");

    return d;
}

class Draw {
    /**
     * Creates an svg object.
     * @private
     * @param {number|string} width - width of the svg
     * @param {number|string} height - height of the svg
     * @param {number} vbWidth - width of the viewbox
     * @param {number} vbHeight - height of the viewbox
     * @param {Object} [options] - additional attributes for the svg
     * @returns {Object} - svg object
     */
    static svg(width, height, vbWidth, vbHeight, options) {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        setAttributes(svg, {
            width,
            height,
            viewBox: "0 0 " + vbWidth + " " + vbHeight,
            preserveAspectRatio: "none"
        });
        setAttributes(svg, options || {});
        return svg;
    }

    /**
     * Draws an svg rectangle.
     * @private
     * @param {number} x - x-coordinate
     * @param {number} y - y-coordinate
     * @param {number} width - width of the rectangle
     * @param {number} height - height of the rectangle
     * @param {string} color - the fill color of the rectangle
     * @param {Object} [options] additional attributes for the rectangle
     * @returns {Object} - svg rectangle
     */
    static rect(x, y, width, height, color, options) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
        setAttributes(rect, {
            width,
            height,
            x,
            y,
            fill: color
        });
        setAttributes(rect, options || {});
        return rect;
    }

    /**
     * Draws an svg line.
     * @private
     * @param {number} x1 - x-coordinate where the line begins
     * @param {number} y1 - y-coordinate where the line begins
     * @param {number} x2 - x-coordinate where the line ends
     * @param {number} y2 - y-coordinate where the line begins
     * @param {string} color - color of the line
     * @param {number} width - width of the line
     * @param {Object} [options] - additional attributes for the line
     * @returns {Object} - svg line
     */
    static line(x1, y1, x2, y2, color, width, options) {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        setAttributes(line, {
            x1,
            y1,
            x2,
            y2,
            stroke: color,
            "stroke-width": width
        });
        setAttributes(line, options || {});
        return line;
    }

    /**
     * Draws an svg path.
     * @private
     * @param {string} shape - the shape of the path 
     * @param {string} color - the color of the path
     * @param {Object} [options] - additional attributes for the path
     * @returns {Object} - svg path
     */
    static path(shape, color, options) {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        setAttributes(path, {
            d: shape,
            fill: color
        });
        setAttributes(path, options || {});
        return path;
    }

    /**
     * Draws an svg text.
     * @private
     * @param {number} x - x-coordinate of the top right left corner of the text
     * @param {number} y - y-coordinate of the top right left corner of the text
     * @param {string} content - the text that is displayed
     * @param {string} color - the text color
     * @param {string} [font = 'Roboto'] - the font name
     * @param {Object} [options] - additional attributes for the text
     * @returns {Object} - svg text
     */
    static text(x, y, content, color, font, options) {
        color = color || "black";
        font = font || 'Roboto';
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        setAttributes(text, {
            x,
            y,
            "font-size": "14px",
            fill: color,
            stroke: "none",
            "font-family": font,
            "text-anchor": "middle",
            class: ["static"]
        });
        setAttributes(text, options || {});
        text.appendChild(document.createTextNode(content))
        return text;
    }

    /**
     * Creates an svg group.
     * @private
     * @returns {Object} - svg group
     */
    static group() {
        return document.createElementNS("http://www.w3.org/2000/svg", "g");
    }
}

///// PUBLIC FUNCTIONS /////

/**
 * Creates a bar chart
 * @class
 */
class Barchart {
    /**
     * Constructs a bar chart
     * @constructor
     * @param {string} element - css query selector of the container dom element into which the chart is placed.
     * @param {Object} [params] - options
     * @param {Object} [params.barSize = 25] - the size of a bar in px.
     * @param {Object[]} [params.data] - the data to be displayed. A list of bars that make up the bar chart.
     * @param {string} [params.data[].label] - the labels underneath the bar.
     * @param {Object[]} [params.data[].datasets] - each dataset represents one "block" of a bar.
     * @param {number} params.data[].datasets[].value - the value of the block.
     * @param {string} [params.data[].datasets[].title] - the title of the block.
     * @param {number|string} [params.max = 'relative'] - the max value of the chart.
     * @param {Object} [params.padding] - padding in all directions of the chart.
     * @param {number|string} [params.padding.top] - top padding for the chart.
     * @param {number|string} [params.padding.right] - right padding for the chart.
     * @param {number|string} [params.padding.bottom] - bottom padding for the chart.
     * @param {number|string} [params.padding.left] - left padding for the chart.
     * @param {Object} [params.colors] - custom colors
     * @param {string[]} [params.colors.foreground = ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc']] - the colors for each bar.
     * @param {boolean} [params.colors.fixToTitle = true] - Whether bar-portions with the same title should also have the same color.
     * @param {string} [params.colors.background = "#E3E6E9"] - the color of the background of the bars (not the color of background of the whole chart).
     * @param {string} [params.colors.text = "black"] - the color of the text.
     * @param {'vertical' | 'horizontal'} [params.orientation = 'vertical'] - orientation for the chart.
     * @param {string} [params.font = 'Roboto'] - the font for all writing. Font must be imported separately.
     * @param {Object} [params.hover] - options for the hover effect.
     * @param {boolean} [params.hover.visible = true] - whether the titles should be shown on hover or not.
     * @param {Function} [params.hover.callback] - function that returns html that is displayed in the hover effect. Receives (title, value).
     * @param {'variable' | number} [params.distance = 'variable'] - whether the distance between timelines should be variable (based on svg size) or a fixed number of px.
     * @param {number} [params.minDistance = 0] - the minimum number of pixels between bars.
     * @param {boolean} [params.adjustSize = false] - whether the size of the container should be adjusted based on the needed space. Only works if params.distance != 'variable'.
     * @param {Object} [params.scale] - options for the scale
     * @param {boolean} [params.scale.visible = true] - whether the scale should be visible or not
     * @param {number} [params.scale.interval = 10] - the interval at which to draw the scale
     * @param {number} [params.scale.color = "#E3E6E9"] - the color of the scale lines
     * @param {boolean} [params.draggable = false] - whether the chart can be dragged
     * @param {Function} [params.onScroll] - called when the user scrolls on the chart
     * @throws Will throw an error if the container element is not found.
     */
    constructor(element, params) {
        this.container = document.querySelector(element);
        if (this.container == null) {
            console.error("Container for chart does not exist");
            return;
        }

        // Extract parameters and sets defaults if parameters not available
        mergeObjects(params, {
            data: [],
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            colors: {
                foreground: ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc'],
                fixToTitle: true,
                background: "#E3E6E9",
                text: "black"
            },
            orientation: "vertical",
            font: "Roboto",
            hover: {
                visible: true,
                callback: (title, value) => `<span style="color: gray">${value}</span>${title !== "" ? ": " + title : ""}`
            },
            barSize: 25,
            distance: 'variable',
            minDistance: 0,
            adjustSize: false,
            max: 'relative',
            scale: {
                visible: true,
                interval: 10,
                color: "#E3E6E9"
            },
            draggable: false,
            onScroll: e => {}
        });

        this.data = params.data;
        this.padding = params.padding;
        this.max = params.max;
        this.foregroundColors = params.colors.foreground;
        this.fixColorToTitle = params.colors.fixToTitle;
        this.backgroundColor = params.colors.background;
        this.textColor = params.colors.text;
        this.orientation = params.orientation;
        this.font = params.font;
        this.hover = params.hover;
        this.barSize = params.barSize;
        this.distance = params.distance;
        this.minDistance = params.minDistance;
        this.adjustSize = this.distance !== 'variable' && params.adjustSize;
        this.scale = params.scale;
        this.draggable = params.draggable;
        this.onScroll = params.onScroll;

        if (this.orientation !== "horizontal") {
            this.drawVertical();

            if (typeof ResizeObserver === "function") {
                const ro = new ResizeObserver(entries => {
                    this.drawVertical();
                });
                ro.observe(this.container);
            } else {
                window.addEventListener('resize', () => {
                    this.drawVertical();
                });
            }
        } else {
            this.drawHorizontal();
            if (typeof ResizeObserver === "function") {
                const ro = new ResizeObserver(entries => {
                    this.drawHorizontal();
                });
                ro.observe(this.container);
            } else {
                window.addEventListener('resize', () => {
                    this.drawHorizontal();
                });
            }
        }
    }

    /**
     * Draws a vertical chart
     * @private
     */
    drawVertical() {
        const realHeight = this.container.clientHeight - this.padding.top - this.padding.bottom;
        const viewboxHeightScale = 100 / realHeight;
        const barCount = this.data.length;
        const barWidth = this.barSize;
        const barHeight = 100 - 25 * viewboxHeightScale;

        if (this.adjustSize) {
            const width = (barWidth + this.distance) * barCount + this.padding.left + this.padding.right;
            this.container.style.width = `${width}px`;
        }

        const realWidth = this.container.clientWidth - this.padding.right - this.padding.left;
        const viewboxWidthScale = realWidth / 100;
        const barSpacing = Math.max(this.minDistance, this.distance === 'variable' ? (100 * viewboxWidthScale - (this.scale.visible ? 30 : 0)) / barCount - barWidth : this.distance);

        // Find max value
        let max = 0
        if(this.max === 'relative') {
            max = this.data.reduce((p, c) => Math.max(p, c.datasets.reduce((p, c) => p + c.value, 0)), 0);
        } else {
            max = this.max;
        }

        const valueMap = {};

        this.svg = Draw.svg(`calc(100% - ${this.padding.right + this.padding.left}px)`, `calc(100% - ${this.padding.top + this.padding.bottom}px)`, 100 * viewboxWidthScale, 100);

        // Padding
        this.svg.style.paddingTop = this.padding.top;
        this.svg.style.paddingRight = this.padding.right;
        this.svg.style.paddingBottom = this.padding.bottom;
        this.svg.style.paddingLeft = this.padding.left;
        this.svg.style.boxSizing = "initial";

        // Draw scale
        const scaleStepSize = barHeight / Math.floor(max / this.scale.interval);

        if(this.scale.visible) {
            for(let i = 1; i < Math.floor(max / this.scale.interval); i++) { // Skip the first bar
                const line = Draw.rect(30, barHeight - i * scaleStepSize, realWidth, 1 * viewboxHeightScale, this.scale.color);
                this.svg.appendChild(line);
            }
        }

        // Draw data
        this.dataContainer = Draw.group();
        this.svg.appendChild(this.dataContainer);

        for (let i = 0; i < barCount; i++) {
            const label = this.data[i].label || "";

            const rx = barWidth / 2;
            const ry = barWidth / 2 * viewboxHeightScale;

            const background = Draw.path(
                `M ${(this.scale.visible ? 30 : 0) + (i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${barHeight - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry * 2 - barHeight} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                this.backgroundColor
            );
            this.dataContainer.appendChild(background);

            let y = 0; // height of the bar. Contains the position at which to draw the next rectangle

            for (let j = 0; j < this.data[i].datasets.length; j++) {
                const value = this.data[i].datasets[j].value || 0;
                const title = this.data[i].datasets[j].title || "";

                let color = "";

                if(this.fixColorToTitle){
                    if (!(title in valueMap)) { // sub-category has not be encountered before
                        color = this.foregroundColors[Object.keys(valueMap).length % this.foregroundColors.length];
                        valueMap[title] = color;
                    } else {
                        color = valueMap[title];
                    }
                } else {
                    color = this.foregroundColors[j % this.foregroundColors.length];
                }

                const height = (barHeight * value / max);
                if(height > 0 && y < barHeight) {
                    const foreground = Draw.path(
                        createVerticalBar((this.scale.visible ? 30 : 0) + (i + 0.5) * barSpacing + i * barWidth, barHeight, rx, ry, height, y, barHeight),
                        color
                    );

                    if (this.hover.visible) {
                        foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, value, title) });
                        foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                    }

                    if (y < barHeight) { // only draw the part if it would not overshoot
                        this.dataContainer.appendChild(foreground);
                    }

                    y = y + height;
                }
            }

            const text = Draw.text((this.scale.visible ? 30 : 0) + (i + 0.5) * (barSpacing + barWidth), barHeight + (20 * viewboxHeightScale), label, this.textColor, this.font, {"style": "user-select: none;"});
            text.setAttribute("transform", `scale(1,${viewboxHeightScale}) translate(0, ${parseFloat(text.getAttribute("y")) / viewboxHeightScale - parseFloat(text.getAttribute("y"))})`);
            this.dataContainer.appendChild(text);
        }

        // Draw scale text
        if(this.scale.visible) {
            const rect = Draw.rect(0, 0, 30, 100, "white");
            this.svg.appendChild(rect);
            for(let i = 1; i < Math.floor(max / this.scale.interval); i++) { // Skip the first bar
                const text = Draw.text(0, barHeight - i * scaleStepSize, i * this.scale.interval, this.textColor, this.font, { "text-anchor": "start", "alignment-baseline": "central", "style": "user-select: none;" });
                text.setAttribute("transform", `scale(1,${viewboxHeightScale}) translate(0, ${parseFloat(text.getAttribute("y")) / viewboxHeightScale - parseFloat(text.getAttribute("y"))})`);
                this.svg.appendChild(text);
            }
        }

        clear(this.container);
        this.tooltip = undefined;
        this.container.appendChild(this.svg);

        if(this.draggable) {
            let startPos;
            let currentTranslate = 0;
            
            this.svg.addEventListener('mousedown',e => startPos = e.clientX);
            this.svg.addEventListener("mousemove", e => {
                if(startPos) {
                    let newPos = currentTranslate + e.clientX - startPos;
                    newPos = Math.min(0, newPos);
                    newPos = Math.max(newPos, -Math.max(0, (this.scale.visible ? 30 : 0) + 0.5 * barSpacing + this.dataContainer.getBoundingClientRect().width - realWidth));

                    this.dataContainer.style.transform = `translateX(${newPos}px)`;
                } else {
                    currentTranslate = parseFloat(this.dataContainer.style.transform.replace("translateX(", "").replace("px)", "")) || 0;
                }
            });
            document.addEventListener('mouseup', () => startPos = undefined);
        }

        this.svg.addEventListener("wheel", this.onScroll);
    }

    /**
     * Draws a horizontal chart
     * @private
     */
    drawHorizontal() {
        const realWidth = this.container.clientWidth - this.padding.right - this.padding.left;
        const viewboxWidthScale = 100 / realWidth;
        const barCount = this.data.length;
        const textWidth = this.data.reduce((p, c) => Math.max(p, c.label !== undefined && c.label.length > 0 ? (2 + c.label.length * 7.5) * viewboxWidthScale : 0), 0); // 7.5 per char 
        const barWidth = 100 - textWidth;
        const barHeight = this.barSize;

        if (this.adjustSize) {
            const height = (barCount + this.distance) * barHeight + this.padding.top + this.padding.bottom;
            this.container.style.height = `${height}px`;
        }

        const realHeight = this.container.clientHeight - this.padding.top - this.padding.bottom;
        const viewboxHeightScale = realHeight / 100;
        const barSpacing = Math.max(this.minDistance, this.distance === 'variable' ? (100 * viewboxHeightScale - (this.scale.visible ? 30 : 0)) / barCount - barHeight : this.distance);

        // Find max value
        let max = 0
        if(this.max === 'relative') {
            max = this.data.reduce((p, c) => Math.max(p, c.datasets.reduce((p, c) => p + c.value, 0)), 0);
        } else {
            max = this.max;
        }

        const valueMap = {};
  
        this.svg = Draw.svg(`calc(100% - ${this.padding.right + this.padding.left}px)`, `calc(100% - ${this.padding.top + this.padding.bottom}px)`, 100, 100 * viewboxHeightScale);

        // Padding
        this.svg.style.paddingTop = this.padding.top;
        this.svg.style.paddingRight = this.padding.right;
        this.svg.style.paddingBottom = this.padding.bottom;
        this.svg.style.paddingLeft = this.padding.left;
        this.svg.style.boxSizing = "initial";

        // Draw scale
        const scaleStepSize = barWidth / Math.floor(max / this.scale.interval);

        if(this.scale.visible) {
            for(let i = 1; i < Math.floor(max / this.scale.interval); i++) { // Skip the first bar
                const line = Draw.rect(i * scaleStepSize, 30, 1 * viewboxWidthScale, realHeight, this.scale.color);
                this.svg.appendChild(line);
            }
        }

        // Draw data
        this.dataContainer = Draw.group();
        this.svg.appendChild(this.dataContainer);

        for (let i = 0; i < barCount; i++) {
            const label = this.data[i].label || "";

            const rx = barHeight / 2 * viewboxWidthScale;
            const ry = barHeight / 2;

            const background = Draw.path(
                `M ${textWidth + rx}, ${(this.scale.visible ? 30 : 0) + (i + 0.5) * barSpacing + i * barHeight} a ${rx},${ry} 0 0 0 0,${barHeight} h ${barWidth - rx * 2} a ${rx},${ry} 0 0 0 0,${-barHeight} z`,
                this.backgroundColor
            );
            this.dataContainer.appendChild(background);

            let x = 0; // width of the bar. Contains the position at which to draw the next rectangle

            for (let j = 0; j < this.data[i].datasets.length; j++) {
                const value = this.data[i].datasets[j].value || 0;
                const title = this.data[i].datasets[j].title || "";

                let color = "";

                if(this.fixColorToTitle){
                    if (!(title in valueMap)) { // sub-category has not be encountered before
                        color = this.foregroundColors[Object.keys(valueMap).length % this.foregroundColors.length];
                        valueMap[title] = color;
                    } else {
                        color = valueMap[title];
                    }
                } else {
                    color = this.foregroundColors[j % this.foregroundColors.length];
                }

                const width = (barWidth * value / max);
                if(width > 0 && x < barWidth) {
                    const foreground = Draw.path(
                        createHorizontalBar(textWidth, (this.scale.visible ? 30 : 0) + (i + 0.5) * barSpacing + i * barHeight, rx, ry, width, x, barWidth),
                        color
                    );

                    if (this.hover.visible) {
                        foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, value, title) });
                        foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                    }
    
                    if (x < barWidth) { // only draw the part if it would not overshoot
                        this.dataContainer.appendChild(foreground);
                    }
    
                    x = x + width;
                }     
            }

            const text = Draw.text(0, (this.scale.visible ? 30 : 0) + (i + 0.5) * (barSpacing + barHeight), label, this.textColor, this.font, { "text-anchor": "start", "alignment-baseline": "central", "style": "user-select: none;" });
            text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
            this.dataContainer.appendChild(text);
        }

         // Draw scale text
         if(this.scale.visible) {
            const rect = Draw.rect(0, 0, 100, 30, "white");
            this.svg.appendChild(rect);
            for(let i = 1; i < Math.floor(max / this.scale.interval); i++) { // Skip the first bar
                const text = Draw.text(i * scaleStepSize, 20, i * this.scale.interval, this.textColor, this.font, { "text-anchor": "middle", "style": "user-select: none;" });
                text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
                this.svg.appendChild(text);
            }
        }

        clear(this.container);
        this.tooltip = undefined;
        this.container.appendChild(this.svg);

        if(this.draggable) {
            let startPos;
            let currentTranslate = 0;
            
            this.svg.addEventListener('mousedown',e => startPos = e.clientY);
            this.svg.addEventListener("mousemove", e => {
                if(startPos) {
                    let newPos = currentTranslate + e.clientY - startPos;
                    newPos = Math.min(0, newPos);
                    newPos = Math.max(newPos, -Math.max(0, (this.scale.visible ? 30 : 0) + 0.5 * barSpacing + this.dataContainer.getBoundingClientRect().height - realHeight));

                    this.dataContainer.style.transform = `translateY(${newPos}px)`;
                } else {
                    currentTranslate = parseFloat(this.dataContainer.style.transform.replace("translateY(", "").replace("px)", "")) || 0;
                }
            });
            document.addEventListener('mouseup', () => startPos = undefined);
        }

        this.svg.addEventListener("wheel", this.onScroll);
    }

    /**
     * Draws a tooltip at the horizontal center of the element
     * @private
     * @param {boolean} show - Whether to show or hide the tooltip
     * @param {Object} g - the element on which the tooltip is centered
     * @param {number|string} value - the value of the element
     * @param {number|string} title - the title of the element
     */
    showTooltip(show, g, value, title) {
        if (this.tooltip === undefined) {
            this.tooltip = document.createElement('div');
            this.tooltip.style.display = "block";
            this.tooltip.style.position = "absolute";
            this.tooltip.style.fontFamily = this.font;
            this.tooltip.classList.add('time-chart-tooltip');
            this.tooltip.appendChild(document.createElement('span'));
            this.container.appendChild(this.tooltip);
        }

        if (!show) {
            this.tooltip.style.visibility = "hidden";
            return;
        }

        clear(this.tooltip);
        this.tooltip.innerHTML = this.hover.callback(title, value);
        this.tooltip.style.top = g.getBoundingClientRect().y - 43 + "px";
        this.tooltip.style.left = `calc(${g.getBoundingClientRect().x + g.getBoundingClientRect().width / 2 - this.tooltip.getBoundingClientRect().width / 2}px)`;
        this.tooltip.style.visibility = "visible";
    }

    /**
     * Replaces the existing data with new data.
     * @param {array} [data] - the data to be displayed
     * @param {string[]} [data.labels] - the labels underneath each bar
     * @param {Object[]} [data.datasets] - each dataset represents one "block" of a bar. To create a stacked bar chart have multiple datasets.
     * @param {number[]} data.datasets[].values - the values for each "block" of a bar. Should be between 0 and 1. 
     * @param {string} [data.datasets[].title] - the title for the dataset.
     */
    setData(data) {
        this.data = data;
        if (this.orientation !== "horizontal") {
            this.drawVertical();
        } else {
            this.drawHorizontal();
        }
    }
}

/**
 * Creates a timeline
 * @class
 */
class Timeline {
    /**
     * Constructs a timeline
     * @constructor
     * @param {string} element - css query selector of the container dom element into which the chart is placed.
     * @param {Object} [params] - options.
     * @param {Object} [params.lineHeight = 25] - the hight of a bar in a timeline in px.
     * @param {Object} [params.scale] - options for the scale at the top of the timelines
     * @param {number} [params.scale.from = 0] - the time in minutes at which the timeline should start.
     * @param {number} [params.scale.to = 1440] - the time in minutes at which the timeline should end.
     * @param {number} [params.scale.interval = 240] - the interval at which labels are shown on the scale.
     * @param {number} [params.scale.intervalStart = 0] - the point at which the interval starts counting.
     * @param {array} [params.data] - the data to be displayed.
     * @param {Object[]} [params.data.timelines] - each object represents one timeline. For multiple timelines under each other, have multiple objects.
     * @param {string} [params.data.timelines[].label] - the label to the right of the timeline.
     * @param {Object[]} params.data.timelines[].values - the values (marked time slots).
     * @param {number} params.data.timelines[].values[].start - the point at which the time slot starts in minutes.
     * @param {number} params.data.timelines[].values[].length - the point at which the time slot ends in minutes.
     * @param {string} [params.data.timelines[].values[].title] - the title of the time slot.
     * @param {string[]} [params.data.timelines[].colors = ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc']] - the colors for the timeline.
     * @param {Object} [params.padding] - padding in all directions of the chart.
     * @param {number|string} [params.padding.top] - top padding for the chart.
     * @param {number|string} [params.padding.right] - right padding for the chart.
     * @param {number|string} [params.padding.bottom] - bottom padding for the chart.
     * @param {number|string} [params.padding.left] - left padding for the chart.
     * @param {Object} [params.colors] - custom colors
     * @param {string} [params.colors.background = "#E3E6E9"] - the color of the background of the bars (not the color of background of the whole chart).
     * @param {string} [params.colors.text = "black"] - the color of the text.
     * @param {string} [params.font = 'Roboto'] - the font for all writing. Font must be imported separately.
     * @param {Object} [params.hover] - options for the hover effect.
     * @param {boolean} [params.hover.visible = true] - whether the titles should be shown on hover or not.
     * @param {Function} [params.hover.callback] - function that returns html that is displayed in the hover effect. Receives (title, start, end).
     * @param {Object} [params.legend] - options for the legend.
     * @param {boolean} [params.legend.visible = true] - whether a legend should be shown underneath the timelines.
     * @param {number} [params.legend.distance = 15] - distance from the last timeline to the legend in px. Always set to 0 if params.legend.visible === false.
     * @param {number} [params.legend.textColor = "white"] - the color of the text in the legend.
     * @param {number} [params.legend.textWidth = "variable"] - distance between the legend text and the legend.
     * @param {'variable' | number} [params.distance = 'variable'] - whether the distance between timelines should be variable (based on svg size) or a fixed number of px.
     * @param {boolean} [params.adjustSize = false] - whether the size of the container should be adjusted based on the needed space. Only works if params.distance != 'variable'.
     * @throws Will throw an error if the container element is not found.
     */
    constructor(element, params) {
        this.container = document.querySelector(element);
        if (this.container == null) {
            console.error("Container for chart does not exist");
            return;
        }

        // Extract parameters and sets defaults if parameters not available
        mergeObjects(params, {
            scale: {
                from: 0,
                to: 1440,
                interval: 240,
                intervalStart: 0
            },
            data: {
                timelines: [],
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 0
            },
            colors: {
                background: "#E3E6E9",
                text: "black"
            },
            font: "Roboto",
            hover: {
                visible: true,
                callback: (title, start, end) => `<span style="color: gray">${this.formatMinutes2(start)} - ${this.formatMinutes2(end)}</span>${title !== "" ? ": " + title : ""}`
            },
            legend: {
                visible: true,
                distance: 15,
                textColor: "white",
                textWidth: "variable"
            },
            lineHeight: 25,
            distance: 'variable',
            adjustSize: false,
        });

        this.scale = params.scale;
        this.data = params.data;
        this.padding = params.padding;
        this.font = params.font;
        this.hover = params.hover;
        this.legend = params.legend.visible;
        this.legendDistance = params.legend.distance;
        this.legendTextColor = params.legend.textColor;
        this.legendTextWidth = params.legend.textWidth;
        this.lineHeight = params.lineHeight;
        this.distance = params.distance;
        this.adjustSize = this.distance !== 'variable' && params.adjustSize;
        this.backgroundColor = params.colors.background;
        this.textColor = params.colors.text;

        this.draw();
        if (typeof ResizeObserver === "function") {
            const ro = new ResizeObserver(entries => {
                this.draw();
            });
            ro.observe(this.container);
        } else {
            window.addEventListener('resize', () => {
                this.draw();
            });
        }
    }

    /**
     * Draws the timeline
     * @private
     */
    draw() {
        const realWidth = this.container.clientWidth - this.padding.right - this.padding.left;
        const viewboxWidthScale = 100 / realWidth;
        const lineCount = this.data.timelines.length;
        const textWidth1 = this.data.timelines.reduce((p, c) => Math.max(p, c.label.length > 0 ? (40 + c.label.length * 7.5) * viewboxWidthScale : 0), 0); // 7.5 per char 
        const textWidth2 = this.data.timelines.reduce((p, c) => Math.max(p, c.values.reduce((p, c) => Math.max(p, (10 + this.formatMinutes(c.length).length * 7.5) * viewboxWidthScale), 0)), 0); // 7.5 per char
        const widthLeft = this.legendTextWidth === "variable" ? Math.max(textWidth1 + textWidth2, 20 * viewboxWidthScale) : this.legendTextWidth * viewboxWidthScale;
        const widthRight = 20 * viewboxWidthScale;
        const scaleHeight = 20;
        const lineWidth = 100 - widthLeft - widthRight;
        const lineHeight = this.lineHeight;
        const legendHeight = this.legend ? lineHeight : 0;
        const legendSpacing = this.legend ? this.legendDistance : 0;

        if (this.adjustSize) {
            const height = scaleHeight + legendHeight + legendSpacing + lineCount * (lineHeight + this.distance) + this.padding.top + this.padding.bottom;
            this.container.style.height = `${height}px`;
        }

        const realHeight = this.container.clientHeight - this.padding.top - this.padding.bottom;
        const viewboxHeightScale = realHeight / 100;
        const lineSpacing = this.distance === 'variable' ? (100 * viewboxHeightScale - scaleHeight - legendHeight - legendSpacing) / lineCount - lineHeight : this.distance;
        const scaleStart = Math.max(0.5 * lineSpacing - scaleHeight, 0);

        this.svg = Draw.svg(`calc(100% - ${this.padding.right + this.padding.left}px)`, `calc(100% - ${this.padding.top + this.padding.bottom}px)`, 100, 100 * viewboxHeightScale);

        // Padding
        this.svg.style.paddingTop = this.padding.top;
        this.svg.style.paddingRight = this.padding.right;
        this.svg.style.paddingBottom = this.padding.bottom;
        this.svg.style.paddingLeft = this.padding.left;
        this.svg.style.boxSizing = "initial";

        // Draw scale
        const from = this.scale.from;
        const to = this.scale.to;
        const interval = this.scale.interval;
        const intervalStart = (this.scale.intervalStart) / (to - from) * lineWidth;
        const intervalSteps = Math.floor((to - from) / interval);
        const intervalStepsWidth = lineWidth / intervalSteps;

        for (let i = 0; i <= intervalSteps; i++) {
            const text = Draw.text(widthLeft + intervalStart + i * intervalStepsWidth, scaleStart, this.formatMinutes2(from + this.scale.intervalStart + i * interval), this.textColor, this.font, { "text-anchor": "middle", "alignment-baseline": "text-before-edge" });
            text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
            this.svg.appendChild(text);
        }

        let x = 0;

        // Draw data
        for (let i = 0; i < lineCount; i++) {
            const label = this.data.timelines[i].label || "";
            const values = this.data.timelines[i].values || [];
            const colors = this.data.timelines[i].colors || ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc'];
            const valueMap = {}; // Helper to calculate grouped values and store color codes
            const sum = this.data.timelines[i].values.reduce((p, c) => p + c.length, 0);

            const rx = lineHeight / 2 * viewboxWidthScale;
            const ry = lineHeight / 2;

            // Draw background
            // Gray background
            const background = Draw.path(
                `M ${widthLeft + rx}, ${scaleStart + scaleHeight + i * (lineSpacing + lineHeight)} a ${rx},${ry} 0 0 0 0,${lineHeight} h ${lineWidth - rx * 2} a ${rx},${ry} 0 0 0 0,${-lineHeight} z`,
                this.backgroundColor
            );
            this.svg.appendChild(background);

            // White stripes each hour
            const steps = (to - from) / 60;
            const stepWidth = lineWidth / steps;

            for (let j = 1; j < steps; j++) {
                const rect = Draw.rect(widthLeft + j * stepWidth - (1 * viewboxWidthScale), scaleStart + scaleHeight + i * (lineSpacing + lineHeight), (2 * viewboxWidthScale), lineHeight, "white");
                this.svg.appendChild(rect);
            }

            // Draw foreground
            for (let j = 0; j < values.length; j++) {
                const relativeStart = (Math.max(0, values[j].start - from) / (to - from));
                const relativeLength = (Math.max(0, values[j].start - from + values[j].length) / (to - from));
                const title = values[j].title || "";

                let color = "";

                if (!(title in valueMap)) { // sub-category has not be encountered before
                    color = colors[Object.keys(valueMap).length % colors.length];
                    valueMap[title] = {
                        color: color,
                        value: values[j].length
                    }
                } else {
                    color = valueMap[title].color;
                    valueMap[title].value = valueMap[title].value + values[j].length;
                }

                let foreground;
                const width = (lineWidth * (relativeLength - relativeStart));

                const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
                    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

                    return {
                        x: centerX + (radius * Math.cos(angleInRadians)),
                        y: centerY + (radius * Math.sin(angleInRadians))
                    };
                }

                const partialCircle = (x, y, radius, startAngle, endAngle) => {

                    const start = polarToCartesian(x, y, radius, endAngle);
                    const end = polarToCartesian(x, y, radius, startAngle);

                    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

                    const d = [
                        "M", start.x, start.y,
                        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
                        "L",
                    ].join(" ");

                    return d;
                }
                const steepness = 0.05; // The smaller, the rounder

                if (width - rx * 2 < 0) { // bar to short to form circle
                    foreground = Draw.path(
                        `M ${widthLeft + lineWidth * relativeStart + width / 2}, ${scaleStart + scaleHeight + i * (lineSpacing + lineHeight)} c ${-(width / 2 / 0.75)} ${lineHeight * steepness}, ${-(width / 2 / 0.75)} ${lineHeight * (1 - steepness)}, 0 ${lineHeight} v ${-lineHeight} c ${width / 2 / 0.75} ${lineHeight * steepness}, ${width / 2 / 0.75} ${lineHeight * (1 - steepness)}, 0 ${lineHeight} z`,
                        color
                    );
                } else {
                    foreground = Draw.path(
                        `M ${widthLeft + lineWidth * relativeStart + rx},${scaleStart + scaleHeight + i * (lineSpacing + lineHeight)} a ${rx},${ry} 0 0 0 0,${lineHeight} h ${(lineWidth * (relativeLength - relativeStart)) - rx * 2} a ${rx},${ry} 0 0 0 0,${-lineHeight} z`,
                        color
                    );
                }
                this.svg.appendChild(foreground);

                if (this.hover.visible) {
                    foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, values[j].start, values[j].start + values[j].length, title) });
                    foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                }
            }

            // Draw label
            const text = Draw.text(0.5 * textWidth1, scaleStart + scaleHeight + i * lineSpacing + (i + 0.5) * lineHeight, label, this.textColor, this.font, { "text-anchor": "middle", "alignment-baseline": "central", "font-weight": "bold" });
            text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
            this.svg.appendChild(text);

            // Draw sum
            const text2 = Draw.text(textWidth1, scaleStart + scaleHeight + i * lineSpacing + (i + 0.5) * lineHeight, this.formatMinutes(sum), this.textColor, this.font, { "text-anchor": "start", "alignment-baseline": "central" });
            text2.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text2.getAttribute("x")) / viewboxWidthScale - parseFloat(text2.getAttribute("x"))}, 0)`);
            this.svg.appendChild(text2);

            // Draw legend
            if (this.legend) {
                for (let key of Object.keys(valueMap)) {
                    const content = `${key} - ${this.formatMinutes(valueMap[key].value)}`;
                    const width = (content.length * 7.5 * viewboxWidthScale) + 2 * rx;
                    const legend = Draw.path(
                        `M ${widthLeft + x + rx},${scaleStart + legendSpacing + scaleHeight + (lineCount - 1) * lineSpacing + lineCount * lineHeight} a ${rx},${ry} 0 0 0 0,${legendHeight} h ${width - rx * 2} a ${rx},${ry} 0 0 0 0,${-legendHeight} z`,
                        valueMap[key].color
                    );
                    this.svg.appendChild(legend);

                    const text = Draw.text(widthLeft + x + 0.5 * width, scaleStart + legendSpacing + legendHeight * 0.5 + scaleHeight + (lineCount - 1) * lineSpacing + lineCount * lineHeight, content, this.legendTextColor, this.font, { "text-anchor": "middle", "alignment-baseline": "central" });
                    text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
                    this.svg.appendChild(text);

                    x = x + width + 10 * viewboxWidthScale; // previous x, width of the rectangle and padding
                }
            }

        }

        clear(this.container);
        this.tooltip = undefined;
        this.container.appendChild(this.svg);
    }

    /**
     * Converts a number of minutes into a string
     * @private
     * @param {number} minutes - the minutes
     * @returns {string} - format: 4h 35m
     */
    formatMinutes(minutes) {
        const h = Math.floor(minutes / 60);
        const m = Math.floor(minutes % 60);

        if (m === 0 && h === 0) {
            return "";
        } else if (m === 0) {
            return `${h}h`;
        } else if (h === 0) {
            return `${m}m`;
        } {
            return `${h}h ${m}m`;
        }
    }

    /**
     * Converts a number of minutes into a string
     * @private
     * @param {number} minutes - the minutes
     * @returns {string} - format: 4:30 am
     */
    formatMinutes2(minutes) {
        let h = Math.floor(minutes / 60);
        let ending = "am";
        const m = Math.floor(minutes % 60);

        if (h > 12) {
            ending = "pm";
            h = h - 12;
        }

        if (m === 0) {
            return `${h} ${ending}`;
        } else {
            return `${h}:${m < 10 ? m + "0" : m} ${ending}`;
        }
    }

    /**
     * Draws a tooltip at the horizontal center of the element
     * @private
     * @param {boolean} show - Whether to show or hide the tooltip
     * @param {Object} g - the element on which the tooltip is centered
     * @param {number} start - the start value in minutes
     * @param {number} end - the vend value in minutes
     * @param {number|string} title - the title of the element
     */
    showTooltip(show, g, start, end, title) {
        if (this.tooltip === undefined) {
            this.tooltip = document.createElement('div');
            this.tooltip.style.display = "block";
            this.tooltip.style.position = "absolute";
            this.tooltip.style.fontFamily = this.font;
            this.tooltip.classList.add('time-chart-tooltip');
            this.tooltip.appendChild(document.createElement('span'));
            this.container.appendChild(this.tooltip);
        }

        if (!show) {
            this.tooltip.style.visibility = "hidden";
            return;
        }

        this.tooltip.style.top = g.getBoundingClientRect().y - 43 + "px";
        clear(this.tooltip);
        this.tooltip.innerHTML = this.hover.callback(title, start, end);
        this.tooltip.style.left = `calc(${g.getBoundingClientRect().x + g.getBoundingClientRect().width / 2 - this.tooltip.getBoundingClientRect().width / 2}px)`;
        this.tooltip.style.visibility = "visible";
    }

    /**
     * Replaces the existing data with new data. 
     * @param {array} [params.data] - the data to be displayed.
     * @param {Object[]} [params.data.timelines] - each object represents one timeline. For multiple timelines under each other, have multiple objects.
     * @param {string} [params.data.timelines[].label] - the label to the right of the timeline.
     * @param {Object[]} params.data.timelines[].values - the values (marked time slots).
     * @param {number} params.data.timelines[].values[].start - the point at which the time slot starts in minutes.
     * @param {number} params.data.timelines[].values[].length - the point at which the time slot ends in minutes.
     * @param {string} [params.data.timelines[].values[].title] - the title of the time slot.
     * @param {string[]} [params.data.timelines[].colors = ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc']] - the colors for the timeline.
     * @param {Object} [params.padding] - padding in all directions of the chart.
     */
    setData(data) {
        this.data = data;
        this.draw();
    }
}

// attach properties to the exports object to define
// the exported module properties.
export {
    Barchart,
    Timeline
}