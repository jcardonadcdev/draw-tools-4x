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
    var drawtools4x;
    (function (drawtools4x) {
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
        drawtools4x.DrawTools = DrawTools;
    })(drawtools4x = exports.drawtools4x || (exports.drawtools4x = {}));
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiRHJhd1Rvb2xzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL0RyYXdUb29scy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7SUF5Q0EsSUFBaUIsV0FBVyxDQWs3QjNCO0lBbDdCRCxXQUFpQixXQUFXO1FBVTFCO1lBQStCLDZCQUFrQjtZQUUvQyx3QkFBd0I7WUFDeEIsRUFBRTtZQUNGLGFBQWE7WUFDYixFQUFFO1lBQ0YsdUJBQXVCO1lBQ3ZCLG1CQUFZLE1BQTBCO2dCQUF0QyxZQUNFLGlCQUFPLFNBSVI7Z0JBb0RELDBEQUEwRDtnQkFDMUQsb0NBQW9DO2dCQUNwQyxlQUFTLEdBQUc7b0JBQ1YsS0FBSyxFQUFFLG9CQUFvQjtvQkFDM0IsVUFBVSxFQUFFLHlEQUF5RDtvQkFDckUsSUFBSSxFQUFFLGlFQUFpRTtvQkFDdkUsUUFBUSxFQUFFLDBEQUEwRDtvQkFDcEUsT0FBTyxFQUFFLDBEQUEwRDtvQkFDbkUsU0FBUyxFQUFFLHlFQUF5RTtpQkFDckYsQ0FBQztnQkFFRix5REFBeUQ7Z0JBQ3pELHVCQUFpQixHQUFHLFVBQUMsR0FBZTtvQkFDbEMsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFDNUMsSUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFJLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztvQkFFNUMsS0FBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcsTUFBTSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUM7b0JBQ3ZELEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDO2dCQUN4RCxDQUFDLENBQUM7Z0JBRUYsd0JBQWtCLEdBQUc7b0JBQ25CLEtBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFT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