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
    ///// PRIVATE HELPERS /////

    /**
     * Sets multiple attributes for a dom element
     * @param {object} obj the dom element
     * @param {object} params the attributes to set
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
     * @param {object} obj the dom element
     */
    function clear(obj) {
        while (obj.firstChild) {
            obj.removeChild(obj.firstChild);
        }
    }


    /**
     * Merges an object into another one
     * @param {object} obj the object into which to merge 
     * @param {object} merger the object to merge 
     * @param {bool} overwrite (optional) whether to overwrite the original value of it exists, default is false
     */
    function mergeObjects(obj, merger, overwrite) {
        overwrite = overwrite === true; // defaults to false

        for (let key of Object.keys(merger)) {
            if (!(key in obj)) {
                obj[key] = merger[key];
            } else if (typeof merger[key] === "object") {
                mergeObjects(obj[key], merger[key], overwrite);
            } else if(overwrite) {
                obj[key] = merger[key];
            }
        }
    }

    class Draw {
        /**
         * Creates an svg
         * 
         * @param {number|string} width width of the svg
         * @param {number|string} height height of the svg
         * @param {number} vbWidth width of the viewbox
         * @param {number} vbHeight height of the viewbox
         * @param {object} options (optional) additional options for the svg
         * @returns {object} svg
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
         * 
         * @param {number} x -coordinate
         * @param {number} y -coordinate
         * @param {number} width of the rectangle
         * @param {number} height of the rectangle
         * @param {string} color the fill color of the rect
         * @param {object} options (optional) additional options for the rectangle
         * @returns {object} svg rectangle
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
         * 
         * @param {*} x1 x-coordinate where the line begins
         * @param {*} y1 y-coordinate where the line begins
         * @param {*} x2 x-coordinate where the line ends
         * @param {*} y2 y-coordinate where the line begins
         * @param {*} color color of the line
         * @param {*} width width of the line
         * @param {object} options (optional) additional options for the line
         * @returns {object} svg line
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
         * Draws an svg path
         * 
         * @param {string} shape the shape of the path 
         * @param {string} color the color of the path
         * @param {object} options (optional) additional options for the path
         * @returns svg path
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
         * 
         * @param {number} x x-coordinate of the top right left corner of the text
         * @param {number} y y-coordinate of the top right left corner of the text
         * @param {string} content the text that is displayed
         * @param {string} color the text color
         * @param {object} options (optional) additional options for the text
         * @returns {object} svg text
         */
        static text(x, y, content, color, options) {
            color = color || "black";
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            setAttributes(text, {
                x,
                y,
                "font-size": "14px",
                fill: color,
                stroke: "none",
                "font-family": "Roboto",
                "text-anchor": "middle",
                class: ["static"]
            });
            setAttributes(text, options || {});
            text.appendChild(document.createTextNode(content))
            return text;
        }

        /**
         * Creates an svg group
         * @returns {object} svg group
         */
        static group() {
            return document.createElementNS("http://www.w3.org/2000/svg", "g");
        }
    }

    ///// PUBLIC FUNCTIONS /////

    /**
     * A basic bar chart
     * 
     * @param {string} element css query selector of the container dom element into which the chart is placed
     * @param {object} params Options
     * @param {array} params.data the data to be displayed
     * @param {number} params.data[].value the value for the bar. should be between 0 and 1
     * @param {string} params.data[].title the text to be displayed underneath the bar
     * @param {object} params.padding padding in all directions of the chart
     * @param {number|string} params.padding.top top padding for the chart
     * @param {number|string} params.padding.right right padding for the chart
     * @param {number|string} params.padding.bottom bottom padding for the chart
     * @param {number|string} params.padding.left left padding for the chart
     */
    class Barchart {
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
                colors: ['#7cd6fd', '#5e64ff', '#743ee2', '#ff5858', '#ffa00a', '#feef72', '#28a745', '#98d85b', '#b554ff', '#ffa3ef', '#36114C', '#bdd3e6', '#f0f4f7', '#b8c2cc']
            });

            this.data = params.data;
            this.padding = params.padding;
            this.colors = params.colors;

            this.draw();
            window.addEventListener('resize', () => {
                this.draw();
            });
        }

        draw() {
            /* 
            Thoughts about size
            
            real width: defined by user via container
            real height: defined by user via container
            svg width: fixed to 100%
            svg height: fixed to 100%
            viewbox width: depends on real width
            viewbox height: fixed to 100px with container at 100px
            bar width: fixed to 11px with viewbox and container at 100px
            bar height: fixed to 70px with viewbox and container at 100px
            bar spacing: depends on real width and number of bars
            text height: fixed to 15px with viewbox and container at 100px
            */
            const realWidth = document.querySelector("#container").clientWidth;
            const realHeight = document.querySelector("#container").clientHeight;
            const viewboxWidthScale = realWidth / 100;
            const viewboxHeightScale = 100 / realHeight;
            const barCount = this.data.datasets.reduce((p, c) => Math.max(p, c.values.length), 0);
            const barWidth = 11;
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

                /*const background = Draw.rect((i + 0.5) * barSpacing + i * barWidth, 0, barWidth, 70, "#E3E6E9", {
                    "rx": 6,
                    "ry": 6 * viewboxHeightScale
                });*/

                const rx = barWidth / 2;
                const ry = 7.5 * viewboxHeightScale;

                const background = Draw.path(
                    `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${70 - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry*2 - 70} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                    "#E3E6E9"
                );
                this.svg.appendChild(background);

                let y = 0; // height of the bar. Contains the position at which to draw the next rectangle

                for(let j = 0; j < this.data.datasets.length; j++) {
                    const value = this.data.datasets[j].values[i] || 0;

                    let foreground;
                    if(this.data.datasets.length === 1) { // single element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${(70 - y) - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry*2 - (70 * value)} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if(y === 0) { // First element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${(70 - y) - ry} a ${rx},${ry} 0 0 0 ${barWidth},0 v ${ry - (70 * value)} h ${-barWidth} z`,
                            this.colors[j % this.colors.length]
                        );
                    } else if(y + 70 * value === 70 || j === this.data.datasets.length - 1) { // Last element
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${(70 - y)} h ${barWidth} v ${ry - (70 * value)} a ${rx},${ry} 0 0 0 ${-barWidth},0 z`,
                            this.colors[j % this.colors.length]
                        );
                    } else { // element in the middle
                        foreground = Draw.path(
                            `M ${(i + 0.5) * barSpacing + i * barWidth},${0} m 0, ${70 - y} h ${barWidth} v ${-70 * value} h ${-barWidth} z`,
                            this.colors[j % this.colors.length]
                        );
                    }

                    if(y < 70) { // only draw the part if it would not overshoot
                        this.svg.appendChild(foreground);     
                    }

                    y = y + 70 * value;
    
                }

                const text = Draw.text((i + 0.5) * (barSpacing + barWidth), 70 + (20 * viewboxHeightScale), label, "black");
                text.setAttribute("transform", `scale(1,${viewboxHeightScale}) translate(0, ${parseFloat(text.getAttribute("y")) / viewboxHeightScale - parseFloat(text.getAttribute("y"))})`);
                this.svg.appendChild(text);
            }

            clear(this.container);
            this.container.appendChild(this.svg);
        }
    }

    // attach properties to the exports object to define
    // the exported module properties.
    exports.Barchart = Barchart;
}));