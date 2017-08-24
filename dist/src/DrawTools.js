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
