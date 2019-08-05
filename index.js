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
    class Barchart {
        constructor(element, params) {
            this.container = document.querySelector(element);
            if (this.container == null) {
                console.error("Container for chart does not exist");
                return;
            }

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
            bar width: fixed to 10px with viewbox and container at 100px
            bar height: fixed to 70px with viewbox and container at 100px
            bar spacing: depends on real width and number of bars
            text height: fixed to 15px with viewbox and container at 100px
            */
            const realWidth = document.querySelector("#container").clientWidth;
            const realHeight = document.querySelector("#container").clientHeight;
            const numberOfBars = 5;
            const viewboxWidthScale = realWidth / 100;
            const viewboxHeightScale = 100 / realHeight;
            const barSpacing = (100 * viewboxWidthScale) / numberOfBars - 10;

            this.svg = Draw.svg("100%", "100%", 100 * viewboxWidthScale, 100);

            for (let i = 0; i < numberOfBars; i++) {
                const rect = Draw.rect((i + 0.5) * barSpacing + i * 10, 0, 10, 70, "black");
                this.svg.appendChild(rect);

                const text = Draw.text((i + 0.5) * barSpacing + i * 10 + 5, 70 + (20 * viewboxHeightScale), "test", "black");
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