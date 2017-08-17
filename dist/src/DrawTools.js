var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
define(["require", "exports", "esri/core/accessorSupport/decorators", "esri/core/Accessor", "esri/core/promiseUtils", "esri/geometry/ScreenPoint", "esri/geometry/Multipoint", "esri/geometry/Polyline", "esri/geometry/Polygon", "esri/geometry/Extent"], function (require, exports, decorators_1, Accessor, promiseUtils, ScreenPoint, Multipoint, Polyline, Polygon, Extent) {
    Object.defineProperty(exports, "__esModule", { value: true });
    var DrawTools = (function (_super) {
        __extends(DrawTools, _super);
        //----------------------
        //
        //  Lifecycle
        //
        //---------------------
        function DrawTools(params) {
            var _this = _super.call(this) || this;
            //Text to display in tooltip for the different geometries.
            //TODO this should be in an nls file
            _this._tooltips = {
                point: "Click to add point",
                multipoint: "Click to add points.<br> Double click to finish drawing",
                line: "Mouse down and drag to make line.<br>Mouse up to finish drawing",
                polyline: "Click to add vertices.<br>Double click to finish drawing",
                polygon: "Click to add vertices.<br>Double click to finish drawing",
                rectangle: "Mouse down and drag<br>to make rectangle.<br>Mouse up to finish drawing"
            };
            //Event handlers for mouse move so tooltip follows cursor
            _this._tooltipMouseMove = function (evt) {
                var clickX = evt.x - _this._canvasOffset.x;
                var clickY = evt.y - _this._canvasOffset.y;
                _this._tooltipContainer.style.left = clickX + 10 + "px";
                _this._tooltipContainer.style.top = clickY + 10 + "px";
            };
            _this._tooltipMouseEnter = function () {
                _this._tooltipContainer.classList.remove("drawtoool-hidden");
            };
            _this._tooltipMouseLeave = function () {
                _this._tooltipContainer.classList.add("drawtoool-hidden");
            };
            _this._canvasOffset = {
                x: 0,
                y: 0
            };
            //This array holds mouse event handlers. They are stored in the array
            // and each listener is removed when the tool is deactivated
            _this._canvasHandlers = [];
            /**
             * The style to use for drawing points. This style is
             * used to draw the multipoint locations as the mouse is clicked.
             * @type {PointStyle}
             */
            _this.pointStyle = {
                color: "rgba(5, 112, 176, 0.25)",
                size: 15,
                outline: {
                    color: "rgb(5, 112, 176)",
                    width: 1
                }
            };
            /**
             * The style to use for drawing lines. This style is
             * used to draw the line and polygon paths as the mouse is clicked.
             * @type {LineStyle}
             */
            _this.lineStyle = {
                color: "rgba(5, 112, 176, 0.25)",
                width: 2
            };
            /**
             * The style to use for drawing fills. This style is
             * used to draw the polygon and rectangle locations as the
             * mouse is clicked or dragged.
             * @type {FillStyle}
             */
            _this.fillStyle = {
                color: "rgba(5, 112, 176, 0.25)",
                outline: {
                    color: "rgb(5, 112, 176)",
                    width: 2
                }
            };
            //--------------------------------
            //
            //  Event Handlers for Map View
            //
            //--------------------------------
            _this.mapViewResized = function (evt) {
                _this._canvas.height = evt.height;
                _this._canvas.width = evt.width;
            };
            //----------------------
            //
            //  Private Methods
            //
            //---------------------
            //-------------------------
            // All activations follow the same pattern.
            //  - Mouse events are added to the canvas
            //  - Points are captured as the mouse is clicked and screen coordinates are
            //     converted to map coordinates
            //  - A geometry is created from the points
            //  - The `latestMapShape` property gets set to the geometry
            //
            //--------------------------
            // Activate Point Tool
            //--------------------------
            _this.activatePoint = function () {
                var mouseClick = function (evt) {
                    _this.setTooltipActive(false);
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    var mapPoint = _this.view.toMap(new ScreenPoint({
                        x: clickX,
                        y: clickY
                    }));
                    _this._set("latestMapShape", mapPoint);
                };
                _this._canvasHandlers.push({
                    type: "click",
                    handler: mouseClick
                });
                _this._canvas.addEventListener("click", mouseClick);
            };
            //--------------------------
            // Activate Multipoint Tool
            //--------------------------
            _this.activateMultipoint = function () {
                var toolActive;
                var toolInfo;
                var radius = _this.pointStyle.size / 2;
                var endAngle = _this.degreesToRadians(360);
                //set context draw styles
                _this._context.strokeStyle = _this.pointStyle.outline.color;
                _this._context.lineWidth = _this.pointStyle.outline.width;
                _this._context.fillStyle = _this.pointStyle.color;
                var click = function (evt) {
                    //console.log("multipoint click: ", evt);
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    if (!toolActive) {
                        toolActive = true;
                        _this.setTooltipActive(false);
                        toolInfo = {
                            type: "multipoint",
                            screenPoints: [],
                            mapPoints: []
                        };
                    }
                    _this._context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    var points = toolInfo.screenPoints;
                    for (var i = 0, n = points.length; i < n; i++) {
                        var point = points[i];
                        var x = point[0];
                        var y = point[1];
                        //this._context.moveTo(x, y);
                        _this._context.beginPath();
                        _this._context.arc(x, y, radius, 0, endAngle);
                        _this._context.fill();
                        _this._context.stroke();
                    }
                };
                var doubleClick = function (evt) {
                    //console.log("multipoint dblclick: ", evt);
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    _this._context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolActive = false;
                    var multipoint = new Multipoint({
                        points: toolInfo.mapPoints,
                        spatialReference: _this.view.spatialReference
                    });
                    _this._set("latestMapShape", multipoint);
                    toolInfo = null;
                };
                var dblclick = _this.makeSingleDoubleClickHandler(click, doubleClick);
                _this._canvasHandlers.push({
                    type: "click",
                    handler: dblclick
                });
                _this._canvasHandlers.push({
                    type: "dblclick",
                    handler: dblclick
                });
                _this._canvas.addEventListener("click", dblclick);
                _this._canvas.addEventListener("dblclick", dblclick);
            };
            //--------------------------
            // Activate Line Tool
            //--------------------------
            _this.activateLine = function () {
                var toolActive;
                var toolInfo;
                //set context draw styles
                _this._context.strokeStyle = _this.lineStyle.color;
                _this._context.lineWidth = _this.lineStyle.width;
                var mouseDown = function (evt) {
                    _this.setTooltipActive(false);
                    toolInfo = {
                        type: "line",
                        screenPoints: [],
                        mapPoints: []
                    };
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolActive = true;
                };
                var mouseMove = function (evt) {
                    if (!toolActive) {
                        return;
                    }
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    context.beginPath();
                    var currentPoint = toolInfo.screenPoints[0];
                    context.moveTo(currentPoint[0], currentPoint[1]);
                    context.lineTo(clickX, clickY);
                    context.stroke();
                };
                var mouseUp = function (evt) {
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolActive = false;
                    _this._set("latestMapShape", new Polyline({
                        paths: [toolInfo.mapPoints],
                        spatialReference: _this.view.spatialReference
                    }));
                    toolInfo = null;
                };
                _this._canvasHandlers.push({
                    type: "mousedown",
                    handler: mouseDown
                });
                _this._canvasHandlers.push({
                    type: "mousemove",
                    handler: mouseMove
                });
                _this._canvasHandlers.push({
                    type: "mouseup",
                    handler: mouseUp
                });
                _this._canvas.addEventListener("mousedown", mouseDown);
                _this._canvas.addEventListener("mousemove", mouseMove);
                _this._canvas.addEventListener("mouseup", mouseUp);
            };
            //--------------------------
            // Activate Polyline Tool
            //--------------------------
            _this.activatePolyline = function () {
                var toolInfo;
                var toolActive;
                //set context draw styles
                _this._context.strokeStyle = _this.lineStyle.color;
                _this._context.lineWidth = _this.lineStyle.width;
                _this._context.fillStyle = _this.pointStyle.color;
                var click = function (evt) {
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    if (!toolActive) {
                        _this.setTooltipActive(false);
                        toolActive = true;
                        toolInfo = {
                            type: "polyline",
                            screenPoints: [],
                            mapPoints: []
                        };
                    }
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    if (toolInfo.screenPoints.length > 0) {
                        context.beginPath();
                        var currentPoint = toolInfo.screenPoints[0];
                        context.moveTo(currentPoint[0], currentPoint[1]);
                        for (var i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
                            currentPoint = toolInfo.screenPoints[i];
                            context.lineTo(currentPoint[0], currentPoint[1]);
                        }
                        context.stroke();
                    }
                };
                var mouseMove = function (evt) {
                    if (!toolActive) {
                        return;
                    }
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    context.beginPath();
                    var currentPoint = toolInfo.screenPoints[0];
                    context.moveTo(currentPoint[0], currentPoint[1]);
                    for (var i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
                        currentPoint = toolInfo.screenPoints[i];
                        context.lineTo(currentPoint[0], currentPoint[1]);
                    }
                    context.lineTo(clickX, clickY);
                    context.stroke();
                };
                var doubleClick = function (evt) {
                    click(evt);
                    _this._context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolActive = false;
                    _this._set("latestMapShape", new Polyline({
                        paths: [toolInfo.mapPoints],
                        spatialReference: _this.view.spatialReference
                    }));
                    toolInfo = null;
                };
                var dblclick = _this.makeSingleDoubleClickHandler(click, doubleClick);
                _this._canvasHandlers.push({
                    type: "click",
                    handler: dblclick
                });
                _this._canvasHandlers.push({
                    type: "mousemove",
                    handler: mouseMove
                });
                _this._canvasHandlers.push({
                    type: "dblclick",
                    handler: dblclick
                });
                _this._canvas.addEventListener("click", dblclick);
                _this._canvas.addEventListener("mousemove", mouseMove);
                _this._canvas.addEventListener("dblclick", dblclick);
            };
            //--------------------------
            // Activate Polygon Tool
            //--------------------------
            _this.activatePolygon = function () {
                var toolInfo;
                var toolActive;
                var context = _this._context;
                //set context draw styles
                context.strokeStyle = _this.fillStyle.outline.color;
                context.lineWidth = _this.fillStyle.outline.width;
                context.fillStyle = _this.fillStyle.color;
                var click = function (evt) {
                    //console.log("poly click");
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    if (!toolActive) {
                        _this.setTooltipActive(false);
                        toolActive = true;
                        toolInfo = {
                            type: "polygon",
                            screenPoints: [],
                            mapPoints: []
                        };
                    }
                    toolInfo.screenPoints.push([clickX, clickY]);
                    var mapPoint = _this.screenCoordsToMapPoint(clickX, clickY);
                    toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    if (toolInfo.screenPoints.length > 0) {
                        context.beginPath();
                        var currentPoint = toolInfo.screenPoints[0];
                        context.moveTo(currentPoint[0], currentPoint[1]);
                        for (var i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
                            currentPoint = toolInfo.screenPoints[i];
                            context.lineTo(currentPoint[0], currentPoint[1]);
                        }
                        context.stroke();
                    }
                };
                var mouseMove = function (evt) {
                    if (!toolActive) {
                        return;
                    }
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    var context = _this._context;
                    context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    context.beginPath();
                    var currentPoint = toolInfo.screenPoints[0];
                    context.moveTo(currentPoint[0], currentPoint[1]);
                    for (var i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
                        currentPoint = toolInfo.screenPoints[i];
                        context.lineTo(currentPoint[0], currentPoint[1]);
                    }
                    context.lineTo(clickX, clickY);
                    context.stroke();
                };
                var doubleClick = function (evt) {
                    //console.log("poly double click");
                    click(evt);
                    _this._context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    toolActive = false;
                    _this._set("latestMapShape", new Polygon({
                        rings: [toolInfo.mapPoints],
                        spatialReference: _this.view.spatialReference
                    }));
                    toolInfo = null;
                };
                var dblclick = _this.makeSingleDoubleClickHandler(click, doubleClick);
                _this._canvasHandlers.push({
                    type: "click",
                    handler: dblclick
                });
                _this._canvasHandlers.push({
                    type: "mousemove",
                    handler: mouseMove
                });
                _this._canvasHandlers.push({
                    type: "dblclick",
                    handler: dblclick
                });
                _this._canvas.addEventListener("click", dblclick);
                _this._canvas.addEventListener("mousemove", mouseMove);
                _this._canvas.addEventListener("dblclick", dblclick);
            };
            //--------------------------
            // Activate Rectangle Tool
            //--------------------------
            _this.activateRectangle = function () {
                var rectangle;
                var toolActive;
                //set context draw styles
                _this._context.fillStyle = _this.fillStyle.color;
                _this._context.strokeStyle = _this.fillStyle.outline.color;
                _this._context.lineWidth = _this.fillStyle.outline.width;
                var mouseDown = function (evt) {
                    _this.setTooltipActive(false);
                    rectangle = {
                        startX: evt.x - _this._canvasOffset.x,
                        startY: evt.y - _this._canvasOffset.y,
                        rect: {}
                    };
                    toolActive = true;
                };
                var mouseMove = function (evt) {
                    if (!toolActive) {
                        return;
                    }
                    var clickX = evt.x - _this._canvasOffset.x;
                    var clickY = evt.y - _this._canvasOffset.y;
                    var x = Math.min(clickX, rectangle.startX), y = Math.min(clickY, rectangle.startY), w = Math.abs(clickX - rectangle.startX), h = Math.abs(clickY - rectangle.startY);
                    if (!w || !h) {
                        return;
                    }
                    rectangle.rect = {
                        x: x,
                        y: y,
                        w: w,
                        h: h
                    };
                    var context = _this._context;
                    var canvas = _this._canvas;
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.fillRect(x, y, w, h);
                    context.strokeRect(x, y, w, h);
                };
                var mouseUp = function (evt) {
                    mouseMove(evt);
                    toolActive = false;
                    _this._context.clearRect(0, 0, _this._canvas.width, _this._canvas.height);
                    //make lower left point and upper right point of extent
                    var rect = rectangle.rect;
                    var ll = _this.screenCoordsToMapPoint(rect.x, rect.y + rect.h);
                    var ur = _this.screenCoordsToMapPoint(rect.x + rect.w, rect.y);
                    _this._set("latestMapShape", new Extent({
                        xmin: ll.x,
                        ymin: ll.y,
                        xmax: ur.x,
                        ymax: ur.y,
                        spatialReference: _this.view.spatialReference
                    }));
                };
                _this._canvasHandlers.push({
                    type: "mousedown",
                    handler: mouseDown
                });
                _this._canvasHandlers.push({
                    type: "mousemove",
                    handler: mouseMove
                });
                _this._canvasHandlers.push({
                    type: "mouseup",
                    handler: mouseUp
                });
                _this._canvas.addEventListener("mousedown", mouseDown);
                _this._canvas.addEventListener("mousemove", mouseMove);
                _this._canvas.addEventListener("mouseup", mouseUp);
            };
            _this._set("view", params.view);
            delete params.view;
            return _this;
        }
        DrawTools_1 = DrawTools;
        DrawTools.prototype.initialize = function () {
            //get container of map view
            var container = this.view.container;
            //canvas for drawing shapes as user clicks
            var canvas = document.createElement("canvas");
            canvas.height = container.clientHeight;
            canvas.width = container.clientWidth;
            canvas.style.position = "absolute";
            canvas.classList.add("drawtoool-not-active");
            //tooltip div
            this._tooltipContainer = document.createElement("div");
            this._tooltipContainer.classList.add("drawtoool-tooltip", "drawtoool-hidden");
            // drawing context for canvas
            this._context = canvas.getContext("2d");
            //add canvas and tooltip div to the view's first child
            container.firstChild.appendChild(canvas);
            container.firstChild.appendChild(this._tooltipContainer);
            //Get the offset of the canvas from the edge of the window.
            //  This offset is used to calculate mouse click x and y
            var boundingRect = canvas.getBoundingClientRect();
            this._canvasOffset = {
                x: boundingRect.left,
                y: boundingRect.top
            };
            this._canvas = canvas;
            // Use mapView resize event to adjust the size of the canvas so it
            //  always covers the map
            this.view.on("resize", this.mapViewResized);
        };
        //----------------------
        //
        //  Public Methods
        //
        //---------------------
        /**
         * Activates the tool for the supplied geometry type.
         * Valid values are the same as the
         * key values in the `validShapes` property. When draw tools
         * are active, the map navigation is disabled
         * @param {string} shape
         * @returns {IPromise<string>} Resolves to the input shape or rejects if the shape is not supported
         */
        DrawTools.prototype.activate = function (shape) {
            // Clear canvas in case a tool is activated without completing the previous draw
            this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            if (!DrawTools_1.validShapes[shape]) {
                return promiseUtils.reject(new Error(shape + " is not a supported shape"));
            }
            this._set("activeTool", shape);
            //Remove the not-active class so the canvas z value is above the map and receives clicks
            this._canvas.classList.remove("drawtoool-not-active");
            //Show tooltip
            this.setTooltipActive(true, shape);
            //Activate the appropriate tool for the geometry
            if (shape === "rectangle") {
                this.activateRectangle();
            }
            else if (shape === "polyline") {
                this.activatePolyline();
            }
            else if (shape === "line") {
                this.activateLine();
            }
            else if (shape === "point") {
                this.activatePoint();
            }
            else if (shape === "multipoint") {
                this.activateMultipoint();
            }
            else if (shape === "polygon") {
                this.activatePolygon();
            }
            return promiseUtils.resolve(shape);
        };
        /**
         * Deactivates the tools. Map navigation is re-enabled
         */
        DrawTools.prototype.deactivate = function () {
            this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
            this._set("activeTool", null);
            this._canvas.classList.add("drawtoool-not-active");
            this.setTooltipActive(false);
            //Remove previously added event listeners
            while (this._canvasHandlers.length) {
                var handlerObj = this._canvasHandlers.pop();
                this._canvas.removeEventListener(handlerObj.type, handlerObj.handler);
                handlerObj.handler = null;
                handlerObj = null;
            }
        };
        //--------------------------------------------------
        // Make an event handler that takes into
        // account single and double click on same element
        //--------------------------------------------------
        DrawTools.prototype.makeSingleDoubleClickHandler = function (singleHandler, doubleHandler) {
            var handler = function (evt) {
                var elem = evt.target;
                var attribName = "data-dbl-click";
                if (elem.getAttribute(attribName) === null) {
                    elem.setAttribute(attribName, "1");
                    setTimeout(function () {
                        if (elem.getAttribute(attribName) === "1") {
                            singleHandler(evt);
                        }
                        else {
                            doubleHandler(evt);
                        }
                        elem.removeAttribute(attribName);
                    }, 150);
                }
                else if (elem.getAttribute(attribName) === "1") {
                    elem.setAttribute(attribName, "2");
                }
            };
            return handler;
        };
        //--------------------------
        // Activate/Deactivate Tooltip
        //--------------------------
        DrawTools.prototype.setTooltipActive = function (active, shape) {
            if (!this.showTooltip) {
                return;
            }
            if (active) {
                this._tooltipContainer.innerHTML = this._tooltips[shape];
                this._canvas.addEventListener("mousemove", this._tooltipMouseMove);
                this._canvas.addEventListener("mouseenter", this._tooltipMouseEnter);
                this._canvas.addEventListener("mouseleave", this._tooltipMouseLeave);
            }
            else {
                this._tooltipContainer.classList.add("drawtoool-hidden");
                this._canvas.removeEventListener("mousemove", this._tooltipMouseMove);
                this._canvas.removeEventListener("mouseenter", this._tooltipMouseEnter);
                this._canvas.removeEventListener("mouseleave", this._tooltipMouseLeave);
            }
        };
        //--------------------------
        // Convert degrees to radians
        //--------------------------
        //Used for drawing arcs
        DrawTools.prototype.degreesToRadians = function (degrees) {
            return (Math.PI / 180) * degrees;
        };
        DrawTools.prototype.screenCoordsToMapPoint = function (x, y) {
            var point = this.view.toMap(new ScreenPoint({
                x: x,
                y: y
            }));
            return new ScreenPoint({
                x: point.x,
                y: point.y
            });
        };
        //----------------------
        //
        //  Public Properties
        //
        //---------------------
        /**
         * Geometries supported by the draw tools
         * @name validShapes
         * @static
         * @type {*}
         */
        DrawTools.validShapes = {
            rectangle: true,
            polyline: true,
            polygon: true,
            line: true,
            point: true,
            multipoint: true
        };
        __decorate([
            decorators_1.property({
                readOnly: true
            })
        ], DrawTools.prototype, "view", void 0);
        __decorate([
            decorators_1.property({
                readOnly: true
            })
        ], DrawTools.prototype, "activeTool", void 0);
        __decorate([
            decorators_1.property()
        ], DrawTools.prototype, "showTooltip", void 0);
        __decorate([
            decorators_1.property({
                readOnly: true
            })
        ], DrawTools.prototype, "latestMapShape", void 0);
        __decorate([
            decorators_1.property()
        ], DrawTools.prototype, "pointStyle", void 0);
        __decorate([
            decorators_1.property()
        ], DrawTools.prototype, "lineStyle", void 0);
        __decorate([
            decorators_1.property()
        ], DrawTools.prototype, "fillStyle", void 0);
        DrawTools = DrawTools_1 = __decorate([
            decorators_1.subclass("src/DrawTools")
        ], DrawTools);
        return DrawTools;
        var DrawTools_1;
    }(decorators_1.declared(Accessor)));
    exports.DrawTools = DrawTools;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHJhd1Rvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0RyYXdUb29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFrREE7UUFBK0IsNkJBQWtCO1FBRS9DLHdCQUF3QjtRQUN4QixFQUFFO1FBQ0YsYUFBYTtRQUNiLEVBQUU7UUFDRix1QkFBdUI7UUFDdkIsbUJBQVksTUFBc0I7WUFBbEMsWUFDRSxpQkFBTyxTQUlSO1lBb0RELDBEQUEwRDtZQUMxRCxvQ0FBb0M7WUFDcEMsZUFBUyxHQUFHO2dCQUNWLEtBQUssRUFBRSxvQkFBb0I7Z0JBQzNCLFVBQVUsRUFBRSx5REFBeUQ7Z0JBQ3JFLElBQUksRUFBRSxpRUFBaUU7Z0JBQ3ZFLFFBQVEsRUFBRSwwREFBMEQ7Z0JBQ3BFLE9BQU8sRUFBRSwwREFBMEQ7Z0JBQ25FLFNBQVMsRUFBRSx5RUFBeUU7YUFDckYsQ0FBQztZQUVGLHlEQUF5RDtZQUN6RCx1QkFBaUIsR0FBRyxVQUFDLEdBQWU7Z0JBQ2xDLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVDLElBQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsS0FBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7Z0JBRTVDLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUN2RCxLQUFJLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQztZQUN4RCxDQUFDLENBQUM7WUFFRix3QkFBa0IsR0FBRztnQkFDbkIsS0FBSSxDQUFDLGlCQUFpQixDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsa0JBQWtCLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUM7WUFF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