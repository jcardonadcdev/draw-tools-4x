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
             * Flag for displaying drawing tooltip
             * @name showTooltip
             * @type {boolean}
             */
            _this.showTooltip = true;
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