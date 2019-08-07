(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['exports'], factory);
    } else if (typeof exports === 'object' && typeof exports.nodeName !== 'string') {
        // CommonJS
        factory(exports);
    } else {
        // Browser globals
        factory((root.TimeCharts = {}));
    }
}(typeof self !== 'undefined' ? self : this, function (exports) {
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
         * @param {string} element - css query selector of the container dom element into which the chart is placed
         * @param {Object} [params] - options
         * @param {Object} [params.barSize = 25] - the size of a bar in px.
         * @param {array} [params.data] - the data to be displayed
         * @param {string[]} [params.data.labels] - the labels underneath each bar
         * @param {Object[]} [params.data.datasets] - each dataset represents one "block" of a bar. To create a stacked bar chart have multiple datasets.
         * @param {number[]} params.data.datasets[].values - the values for each "block" of a bar. Should be between 0 and 1. 
         * @param {string} [params.data.datasets[].title] - the title for the dataset.
         * @param {Object} [params.padding] - padding in all directions of the chart.
         * @param {number|string} [params.padding.top] - top padding for the chart.
         * @param {number|string} [params.padding.right] - right padding for the chart.
         * @param {number|string} [params.padding.bottom] - bottom padding for the chart.
         * @param {number|string} [params.padding.left] - left padding for the chart.
         * @param {string} [params.colors = ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc']] - the colors for each bar.
         * @param {'vertical' | 'horizontal'} [params.orientation = 'vertical'] - orientation for the chart.
         * @param {string} [params.font = 'Roboto'] - the font for all writing. Font must be imported separately.
         * @param {boolean} [params.hover = true] - whether the titles should be shown on hover or not.
         * @throws Will throw an error if the container element is not found
         */
        constructor(element, params) {
            this.container = document.querySelector(element);
            if (this.container == null) {
                console.error("Container for chart does not exist");
                return;
            }

            // Extract parameters and sets defaults if parameters not available
            mergeObjects(params, {
                data: {
                    labels: [],
                    datasets: []
                },
                padding: {
                    top: 0,
                    right: 0,
                    bottom: 0,
                    left: 0
                },
                colors: ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc'],
                orientation: "vertical",
                font: "Roboto",
                hover: true,
                barSize: 25
            });

            this.data = params.data;
            this.padding = params.padding;
            this.colors = params.colors;
            this.orientation = params.orientation;
            this.font = params.font;
            this.hover = params.hover;
            this.barSize = params.barSize;

            if (this.orientation !== "horizontal") {
                this.drawVertical();
                window.addEventListener('resize', () => {
                    this.drawVertical();
                });
            } else {
                this.drawHorizontal();
                window.addEventListener('resize', () => {
                    this.drawHorizontal();
                });
            }
        }

        /**
         * Draws a vertical chart
         * @private
         */
        drawVertical() {
            const realWidth = document.querySelector("#container").clientWidth;
            const realHeight = document.querySelector("#container").clientHeight;
            const viewboxWidthScale = realWidth / 100;
            const viewboxHeightScale = 100 / realHeight;
            const barCount = this.data.datasets.reduce((p, c) => Math.max(p, c.values.length), 0);
            const barWidth = this.barSize;
            const barSpacing = (100 * viewboxWidthScale) / barCount - barWidth;

            this.svg = Draw.svg("100%", "100%", 100 * viewboxWidthScale, 100);

            // Padding
            this.svg.style.paddingTop = this.padding.top;
            this.svg.style.paddingRight = this.padding.right;
            this.svg.style.paddingBottom = this.padding.bottom;
            this.svg.style.paddingLeft = this.padding.left;

            // Draw data
            for (let i = 0; i < barCount; i++) {
                const label = this.data.labels[i] || "";

                const rx = barWidth / 2;
                const ry = barWidth / 2 * viewboxHeightScale;

                const background = Draw.path(
                    `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${70 - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry * 2 - 70} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                    "#E3E6E9"
                );
                this.svg.appendChild(background);

                let y = 0; // height of the bar. Contains the position at which to draw the next rectangle

                for (let j = 0; j < this.data.datasets.length; j++) {
                    const value = this.data.datasets[j].values[i] || 0;
                    const title = this.data.datasets[j].title || "";

                    let foreground;
                    if (this.data.datasets.length === 1) { // single element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${(70 - y) - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry * 2 - (70 * value)} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if (y === 0) { // First element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${(70 - y) - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry - (70 * value)} h ${-barWidth} z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if (y + 70 * value === 70 || j === this.data.datasets.length - 1) { // Last element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${70 - y} h ${barWidth} v ${ry - (70 * value)} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                            this.colors[j % this.colors.length]
                        );
                    } else { // element in the middle
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${70 - y} h ${barWidth} v ${-70 * value} h ${-barWidth} z`,
                            this.colors[j % this.colors.length]
                        );
                    }

                    if(this.hover) {
                        foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, value, title) });
                        foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                    }

                    if (y < 70) { // only draw the part if it would not overshoot
                        this.svg.appendChild(foreground);
                    }

                    y = y + 70 * value;
                }

                const text = Draw.text((i + 0.5) * (barSpacing + barWidth), 70 + (20 * viewboxHeightScale), label, "black", this.font);
                text.setAttribute("transform", `scale(1,${viewboxHeightScale}) translate(0, ${parseFloat(text.getAttribute("y")) / viewboxHeightScale - parseFloat(text.getAttribute("y"))})`);
                this.svg.appendChild(text);
            }

            clear(this.container);
            this.tooltip = undefined;
            this.container.appendChild(this.svg);
        }

        /**
         * Draws a horizontal chart
         * @private
         */
        drawHorizontal() {
            const realWidth = document.querySelector("#container").clientWidth;
            const realHeight = document.querySelector("#container").clientHeight;
            const viewboxWidthScale = 100 / realWidth;
            const viewboxHeightScale = realHeight / 100;
            const barCount = this.data.datasets.reduce((p, c) => Math.max(p, c.values.length), 0);
            const textWidth = this.data.labels.reduce((p, c) => Math.max(p, c.length > 0 ? (2 + c.length * 7.5) * viewboxWidthScale : 0), 0); // 7.5 per char 
            const barWidth = 100 - textWidth;
            const barHeight = this.barSize;
            const barSpacing = (100 * viewboxHeightScale) / barCount - barHeight;

            this.svg = Draw.svg("100%", "100%", 100, 100 * viewboxHeightScale);

            // Padding
            this.svg.style.paddingTop = this.padding.top;
            this.svg.style.paddingRight = this.padding.right;
            this.svg.style.paddingBottom = this.padding.bottom;
            this.svg.style.paddingLeft = this.padding.left;

            // Draw data
            for (let i = 0; i < barCount; i++) {
                const label = this.data.labels[i] || "";

                const rx = barHeight / 2 * viewboxWidthScale;
                const ry = barHeight / 2;

                const background = Draw.path(
                    `M ${textWidth + rx}, ${(i + 0.5) * barSpacing + i * barHeight} a ${rx},${ry} 0 0 0 0,${barHeight} h ${barWidth - rx * 2} a ${rx},${ry} 0 0 0 0,${-barHeight} z`,
                    "#E3E6E9"
                );
                this.svg.appendChild(background);

                let x = 0; // width of the bar. Contains the position at which to draw the next rectangle

                for (let j = 0; j < this.data.datasets.length; j++) {
                    const value = this.data.datasets[j].values[i] || 0;
                    const title = this.data.datasets[j].title || "";

                    let foreground;
                    if (this.data.datasets.length === 1) { // single element
                        foreground = Draw.path(
                            `M ${textWidth + x + rx},${(i + 0.5) * barSpacing + i * barHeight} a ${rx},${ry} 0 0 0 0,${barHeight} h ${(barWidth * value) - rx * 2} a ${rx},${ry} 0 0 0 0,${-barHeight} z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if (x === 0) { // First element
                        foreground = Draw.path(
                            `M ${textWidth + x + rx},${(i + 0.5) * barSpacing + i * barHeight} a ${rx},${ry} 0 0 0 0,${barHeight} h ${(barWidth * value) - rx} v ${-barHeight} z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if (x + barWidth * value === barWidth || j === this.data.datasets.length - 1) { // Last element
                        foreground = Draw.path(
                            `M ${textWidth + x},${(i + 0.5) * barSpacing + i * barHeight} v ${barHeight} h ${(barWidth * value) - rx} a ${rx},${ry} 0 0 0 0,${-barHeight} z`,
                            this.colors[j % this.colors.length]
                        );
                    } else { // element in the middle
                        foreground = Draw.path(
                            `M ${textWidth + x}, ${(i + 0.5) * barSpacing + i * barHeight} v ${barHeight} h ${barWidth * value} v ${-barHeight} z`,
                            this.colors[j % this.colors.length]
                        );
                    }

                    if(this.hover) {
                        foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, value, title) });
                        foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                    }

                    if (x < barWidth) { // only draw the part if it would not overshoot
                        this.svg.appendChild(foreground);
                    }

                    x = x + barWidth * value;
                }

                const text = Draw.text(0, (i + 0.5) * (barSpacing + barHeight), label, "black", this.font, { "text-anchor": "start", "alignment-baseline": "central" });
                text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
                this.svg.appendChild(text);
            }

            clear(this.container);
            this.tooltip = undefined;
            this.container.appendChild(this.svg);
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
                this.tooltip.style.display = "none";
                return;
            }

            this.tooltip.style.top = g.getBoundingClientRect().y - 43 + "px";
            this.tooltip.style.webkitTransform = `translate3d(calc(${g.getBoundingClientRect().x + g.getBoundingClientRect().width / 2}px - 50%), calc(0px), 0)`;
            clear(this.tooltip);
            this.tooltip.innerHTML = `<span style="color: gray">${value}</span>${title !== "" ? ": " + title : ""}`;
            this.tooltip.style.display = "block";
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
         * @param {string} [params.font = 'Roboto'] - the font for all writing. Font must be imported separately.
         * @param {boolean} [params.hover = true] - whether the titles should be shown on hover or not.
         * @param {boolean} [params.legend = true] - whether a legend should be shown underneath the timelines
         * @throws Will throw an error if the container element is not found
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
                font: "Roboto",
                hover: true,
                legend: true,
                lineHeight: 25
            });

            this.scale = params.scale;
            this.data = params.data;
            this.padding = params.padding;
            this.font = params.font;
            this.hover = params.hover;
            this.legend = params.legend;
            this.lineHeight = params.lineHeight;

            this.draw();
            window.addEventListener('resize', () => {
                this.draw();
            });
        }

        /**
         * Draws the timeline
         * @private
         */
        draw() {
            const realWidth = document.querySelector("#container").clientWidth;
            const realHeight = document.querySelector("#container").clientHeight;
            const viewboxWidthScale = 100 / realWidth;
            const viewboxHeightScale = realHeight / 100;
            const lineCount = this.data.timelines.length;
            const textWidth1 = this.data.timelines.reduce((p, c) => Math.max(p, c.label.length > 0 ? (40 + c.label.length * 7.5) * viewboxWidthScale : 0), 0); // 7.5 per char 
            const textWidth2 = this.data.timelines.reduce((p, c) => Math.max(p, c.values.reduce((p, c) => Math.max(p, (10 + this.formatMinutes(c.length).length * 7.5) * viewboxWidthScale), 0)), 0); // 7.5 per char
            const widthLeft = Math.max(textWidth1 + textWidth2, 20 * viewboxWidthScale);
            const widthRight = 20 * viewboxWidthScale;
            const scaleHeight = 20;
            const lineWidth = 100 - widthLeft - widthRight;
            const lineHeight = this.lineHeight;
            const legendHeight = lineHeight;
            const legendSpacing = 10;
            const lineSpacing = (100 * viewboxHeightScale - scaleHeight - legendHeight - legendSpacing) / lineCount - lineHeight;

            this.svg = Draw.svg("100%", "100%", 100, 100 * viewboxHeightScale);

            // Padding
            this.svg.style.paddingTop = this.padding.top;
            this.svg.style.paddingRight = this.padding.right;
            this.svg.style.paddingBottom = this.padding.bottom;
            this.svg.style.paddingLeft = this.padding.left;

            // Draw scale
            const from = this.scale.from;
            const to = this.scale.to;
            const interval = this.scale.interval;
            const intervalStart = (this.scale.intervalStart) / (to - from) * lineWidth;
            const intervalSteps = Math.floor((to - from) / interval);
            const intervalStepsWidth = lineWidth / intervalSteps;
            
            for(let i = 0; i <= intervalSteps; i++) {
                const text = Draw.text(widthLeft + intervalStart + i * intervalStepsWidth, 0, this.formatMinutes2(from + this.scale.intervalStart + i * interval), "black", this.font, { "text-anchor": "middle", "alignment-baseline": "text-before-edge" });
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
                    `M ${widthLeft + rx}, ${scaleHeight + (i + 0.5) * lineSpacing + i * lineHeight} a ${rx},${ry} 0 0 0 0,${lineHeight} h ${lineWidth - rx * 2} a ${rx},${ry} 0 0 0 0,${-lineHeight} z`,
                    "#E3E6E9"
                );
                this.svg.appendChild(background);

                // White stripes each hour
                const steps = (to-from) / 60;
                const stepWidth = lineWidth / steps;

                for(let j = 1; j < steps; j++) {
                    const rect = Draw.rect(widthLeft + j * stepWidth - (1 * viewboxWidthScale), scaleHeight + (i + 0.5) * lineSpacing + i * lineHeight, (2 * viewboxWidthScale), lineHeight, "white");
                    this.svg.appendChild(rect);
                }

                // Draw foreground
                for(let j = 0; j < values.length; j++) {
                    const relativeStart = (Math.max(0, values[j].start - from) / (to - from));
                    const relativeLength = (Math.max(0, values[j].start - from + values[j].length) / (to - from));
                    const title = values[j].title || "";

                    let color = "";

                    if(!(title in valueMap)) { // sub-category has not be encountered before
                        color = colors[Object.keys(valueMap).length % colors.length];
                        valueMap[title] = {
                            color: color,
                            value: values[j].length
                        }
                    } else {
                        color = valueMap[title].color;
                        valueMap[title].value = valueMap[title].value + values[j].length;
                    }

                    const foreground = Draw.path(
                        `M ${widthLeft + lineWidth * relativeStart + rx},${scaleHeight + (i + 0.5) * lineSpacing + i * lineHeight} a ${rx},${ry} 0 0 0 0,${lineHeight} h ${(lineWidth * (relativeLength - relativeStart)) - rx * 2} a ${rx},${ry} 0 0 0 0,${-lineHeight} z`,
                        color
                    );
                    this.svg.appendChild(foreground);

                    if(this.hover) {
                        foreground.addEventListener('mouseenter', evt => { this.showTooltip(true, foreground, values[j].start, values[j].start + values[j].length, title) });
                        foreground.addEventListener("mouseleave", evt => { this.showTooltip(false) });
                    }
                }

                // Draw label
                const text = Draw.text(0.5 * textWidth1, scaleHeight + (i + 0.5) * (lineSpacing + lineHeight), label, "black", this.font, { "text-anchor": "middle", "alignment-baseline": "central", "font-weight": "bold" });
                text.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text.getAttribute("x")) / viewboxWidthScale - parseFloat(text.getAttribute("x"))}, 0)`);
                this.svg.appendChild(text);

                // Draw sum
                const text2 = Draw.text(textWidth1, scaleHeight + (i + 0.5) * (lineSpacing + lineHeight), this.formatMinutes(sum), "black", this.font, { "text-anchor": "start", "alignment-baseline": "central" });
                text2.setAttribute("transform", `scale(${viewboxWidthScale},1) translate(${parseFloat(text2.getAttribute("x")) / viewboxWidthScale - parseFloat(text2.getAttribute("x"))}, 0)`);
                this.svg.appendChild(text2);

                // Draw legend
                if(this.legend) {
                    for(let key of Object.keys(valueMap)) {
                        const content = `${key} - ${this.formatMinutes(valueMap[key].value)}`;
                        const width = (content.length * 7.5 * viewboxWidthScale) + 2*rx;
                        const legend = Draw.path(
                            `M ${widthLeft + x + rx},${legendSpacing + scaleHeight + (lineCount - 0.5) * lineSpacing + lineCount * lineHeight} a ${rx},${ry} 0 0 0 0,${legendHeight} h ${width - rx * 2} a ${rx},${ry} 0 0 0 0,${-legendHeight} z`,
                            valueMap[key].color
                        );
                        this.svg.appendChild(legend);

                        const text = Draw.text(widthLeft + x + 0.5 * width, legendSpacing + legendHeight * 0.5 + scaleHeight + (lineCount - 0.5) * lineSpacing + lineCount * lineHeight, content, "white", this.font, { "text-anchor": "middle", "alignment-baseline": "central" });
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

            if(m === 0 && h === 0) {
                return "";
            } else if(m === 0) {
                return `${h}h`;
            } else if(h === 0) {
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

            if(m === 0) {
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
                this.tooltip.style.display = "none";
                return;
            }

            this.tooltip.style.top = g.getBoundingClientRect().y - 43 + "px";
            this.tooltip.style.webkitTransform = `translate3d(calc(${g.getBoundingClientRect().x + g.getBoundingClientRect().width / 2}px - 50%), calc(0px), 0)`;
            clear(this.tooltip);
            this.tooltip.innerHTML = `<span style="color: gray">${this.formatMinutes2(start)} - ${this.formatMinutes2(end)}</span>${title !== "" ? ": " + title : ""}`;
            this.tooltip.style.display = "block";
        }
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.Barchart = Barchart;
    exports.Timeline = Timeline;
}));