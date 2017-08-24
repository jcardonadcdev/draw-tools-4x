import {
  subclass,
  property,
  declared
} from "esri/core/accessorSupport/decorators";

import Accessor = require("esri/core/Accessor");
import promiseUtils = require("esri/core/promiseUtils");

import MapView = require("esri/views/MapView");

import ScreenPoint = require("esri/geometry/ScreenPoint");

import Multipoint = require("esri/geometry/Multipoint");
import Polyline = require("esri/geometry/Polyline");
import Polygon = require("esri/geometry/Polygon");
import Extent = require("esri/geometry/Extent");

interface ToolInfo {
  type: string;
  screenPoints: number[][];
  mapPoints: number[][];
}

export namespace drawtools4x {
  //Interfaces for draw styles
  export interface LineStyle {
    width: number;
    color: string;
  }

  export interface FillStyle {
    color?: string;
    outline: LineStyle;
  }

  export interface PointStyle {
    color: string;
    size: number;
    outline?: LineStyle;
  }

  export interface DrawToolProperties {
    view: MapView;
    showTooltip?: boolean;
    pointStyle?: PointStyle;
    lineStyle?: LineStyle;
    fillStyle?: FillStyle;
  }

  @subclass("src/DrawTools")
  export class DrawTools extends declared(Accessor) {

    //----------------------
    //
    //  Lifecycle
    //
    //---------------------
    constructor(params: DrawToolProperties) {
      super();

      this._set("view", params.view);
      delete params.view;
    }

    initialize() {
      //get container of map view
      const container = this.view.container as Element;

      //canvas for drawing shapes as user clicks
      const canvas = document.createElement("canvas");
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
      const boundingRect = canvas.getBoundingClientRect();

      this._canvasOffset = {
        x: boundingRect.left,
        y: boundingRect.top
      };

      this._canvas = canvas;

      // Use mapView resize event to adjust the size of the canvas so it
      //  always covers the map
      this.view.on("resize", this.mapViewResized);
    }


    //----------------------
    //
    //  Variables
    //
    //---------------------

    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;

    _tooltipContainer: HTMLElement;

    //Text to display in tooltip for the different geometries.
    //TODO this should be in an nls file
    _tooltips = {
      point: "Click to add point",
      multipoint: "Click to add points.<br> Double click to finish drawing",
      line: "Mouse down and drag to make line.<br>Mouse up to finish drawing",
      polyline: "Click to add vertices.<br>Double click to finish drawing",
      polygon: "Click to add vertices.<br>Double click to finish drawing",
      rectangle: "Mouse down and drag<br>to make rectangle.<br>Mouse up to finish drawing"
    };

    //Event handlers for mouse move so tooltip follows cursor
    _tooltipMouseMove = (evt: MouseEvent) => {
      const clickX = evt.x - this._canvasOffset.x;
      const clickY = evt.y - this._canvasOffset.y;

      this._tooltipContainer.style.left = clickX + 10 + "px";
      this._tooltipContainer.style.top = clickY + 10 + "px";
    };

    _tooltipMouseEnter = () => {
      this._tooltipContainer.classList.remove("drawtoool-hidden");
    };

    _tooltipMouseLeave = () => {
      this._tooltipContainer.classList.add("drawtoool-hidden");
    };

    _canvasOffset = {
      x: 0,
      y: 0
    };

    //This array holds mouse event handlers. They are stored in the array
    // and each listener is removed when the tool is deactivated
    _canvasHandlers: any[] = [];

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
    static validShapes = {
      rectangle: true,
      polyline: true,
      polygon: true,
      line: true,
      point: true,
      multipoint: true
    };

    /**
     * The MapView using the draw tools
     * @name view
     * @type {MapView}
     * @readonly
     */
    @property({
      readOnly: true
    })
    readonly view: MapView;


    /**
     * The currently active tool type. Values are the same as the
     * key values in the `validShapes` property
     * @name activeTool
     * @readonly
     * @type {string}
     */
    @property({
      readOnly: true
    })
    readonly activeTool: string;

    /**
     * Flag for displaying drawing tooltip
     * @name showTooltip
     * @type {boolean}
     */
    @property()
    showTooltip: boolean = true;


    /**
     * The last geometry created by the draw tools. This property
     * can be watched to capture when a geometry has been drawn.
     * The property is one of the esri/geometry/Geometry types
     * @name latestMapShape
     * @type {*}
     */
    @property({
      readOnly: true
    })
    latestMapShape: any;


    /**
     * The style to use for drawing points. This style is
     * used to draw the multipoint locations as the mouse is clicked.
     * @type {PointStyle}
     */
    @property()
    pointStyle: PointStyle = {
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
    @property()
    lineStyle: LineStyle = {
      color: "rgba(5, 112, 176, 0.25)",
      width: 2
    };


    /**
     * The style to use for drawing fills. This style is
     * used to draw the polygon and rectangle locations as the
     * mouse is clicked or dragged.
     * @type {FillStyle}
     */
    @property()
    fillStyle: FillStyle = {
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

    mapViewResized = (evt: any) => {
      this._canvas.height = evt.height;
      this._canvas.width = evt.width;
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
    activate(shape: string): IPromise<string> {
      // Clear canvas in case a tool is activated without completing the previous draw
      this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      if (!DrawTools.validShapes[shape]) {
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
    }


    /**
     * Deactivates the tools. Map navigation is re-enabled
     */
    deactivate(): void {
      this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

      this._set("activeTool", null);
      this._canvas.classList.add("drawtoool-not-active");

      this.setTooltipActive(false);

      //Remove previously added event listeners
      while (this._canvasHandlers.length) {
        let handlerObj = this._canvasHandlers.pop();
        this._canvas.removeEventListener(handlerObj.type, handlerObj.handler);
        handlerObj.handler = null;
        handlerObj = null;
      }
    }

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

    activatePoint = () => {
      const mouseClick = (evt: MouseEvent) => {
        this.setTooltipActive(false);
        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        const mapPoint = this.view.toMap(new ScreenPoint({
          x: clickX,
          y: clickY
        }));

        this._set("latestMapShape", mapPoint);
      };

      this._canvasHandlers.push({
        type: "click",
        handler: mouseClick
      });

      this._canvas.addEventListener("click", mouseClick);
    };


    //--------------------------
    // Activate Multipoint Tool
    //--------------------------

    activateMultipoint = () => {
      let toolActive: boolean;

      let toolInfo: ToolInfo;

      const radius = this.pointStyle.size / 2;
      const endAngle = this.degreesToRadians(360);

      //set context draw styles
      this._context.strokeStyle = this.pointStyle.outline.color;
      this._context.lineWidth = this.pointStyle.outline.width;
      this._context.fillStyle = this.pointStyle.color;


      const click = (evt: MouseEvent) => {
        //console.log("multipoint click: ", evt);
        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        if (!toolActive) {
          toolActive = true;
          this.setTooltipActive(false);

          toolInfo = {
            type: "multipoint",
            screenPoints: [],
            mapPoints: []
          };
        }

        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        const points = toolInfo.screenPoints;
        for (let i = 0, n = points.length; i < n; i++) {
          const point = points[i];
          const x = point[0];
          const y = point[1];

          //this._context.moveTo(x, y);
          this._context.beginPath();
          this._context.arc(x, y, radius, 0, endAngle);
          this._context.fill();
          this._context.stroke();
        }
      };

      const doubleClick = (evt: MouseEvent) => {
        //console.log("multipoint dblclick: ", evt);

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolActive = false;

        const multipoint = new Multipoint({
          points: toolInfo.mapPoints,
          spatialReference: this.view.spatialReference
        });

        this._set("latestMapShape", multipoint);

        toolInfo = null;
      };

      const dblclick = this.makeSingleDoubleClickHandler(click, doubleClick);


      this._canvasHandlers.push({
        type: "click",
        handler: dblclick
      });

      this._canvasHandlers.push({
        type: "dblclick",
        handler: dblclick
      });

      this._canvas.addEventListener("click", dblclick);
      this._canvas.addEventListener("dblclick", dblclick);
    };


    //--------------------------
    // Activate Line Tool
    //--------------------------

    activateLine = () => {
      let toolActive: boolean;

      let toolInfo: ToolInfo;

      //set context draw styles
      this._context.strokeStyle = this.lineStyle.color;
      this._context.lineWidth = this.lineStyle.width;

      const mouseDown = (evt: MouseEvent) => {
        this.setTooltipActive(false);

        toolInfo = {
          type: "line",
          screenPoints: [],
          mapPoints: []
        };

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolActive = true;
      };

      const mouseMove = (evt: MouseEvent) => {
        if (!toolActive) {
          return;
        }

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        context.beginPath();
        const currentPoint = toolInfo.screenPoints[0];

        context.moveTo(currentPoint[0], currentPoint[1]);
        context.lineTo(clickX, clickY);
        context.stroke();
      };

      const mouseUp = (evt: MouseEvent) => {
        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolActive = false;

        this._set("latestMapShape", new Polyline({
          paths: [toolInfo.mapPoints],
          spatialReference: this.view.spatialReference
        }));

        toolInfo = null;
      };

      this._canvasHandlers.push({
        type: "mousedown",
        handler: mouseDown
      });

      this._canvasHandlers.push({
        type: "mousemove",
        handler: mouseMove
      });

      this._canvasHandlers.push({
        type: "mouseup",
        handler: mouseUp
      });

      this._canvas.addEventListener("mousedown", mouseDown);
      this._canvas.addEventListener("mousemove", mouseMove);
      this._canvas.addEventListener("mouseup", mouseUp);
    };


    //--------------------------
    // Activate Polyline Tool
    //--------------------------
    activatePolyline = () => {
      let toolInfo: ToolInfo;
      let toolActive: boolean;

      //set context draw styles
      this._context.strokeStyle = this.lineStyle.color;
      this._context.lineWidth = this.lineStyle.width;

      this._context.fillStyle = this.pointStyle.color;

      const click = (evt: MouseEvent) => {

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        if (!toolActive) {
          this.setTooltipActive(false);
          toolActive = true;

          toolInfo = {
            type: "polyline",
            screenPoints: [],
            mapPoints: []
          };
        }

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        if (toolInfo.screenPoints.length > 0) {
          context.beginPath();
          let currentPoint = toolInfo.screenPoints[0];
          context.moveTo(currentPoint[0], currentPoint[1]);

          for (let i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
            currentPoint = toolInfo.screenPoints[i];
            context.lineTo(currentPoint[0], currentPoint[1]);
          }

          context.stroke();
        }
      };

      const mouseMove = (evt: MouseEvent) => {
        if (!toolActive) {
          return;
        }

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        context.beginPath();
        let currentPoint = toolInfo.screenPoints[0];
        context.moveTo(currentPoint[0], currentPoint[1]);

        for (let i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
          currentPoint = toolInfo.screenPoints[i];
          context.lineTo(currentPoint[0], currentPoint[1]);
        }

        context.lineTo(clickX, clickY);
        context.stroke();
      };

      const doubleClick = (evt: MouseEvent) => {
        click(evt);

        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolActive = false;
        this._set("latestMapShape", new Polyline({
          paths: [toolInfo.mapPoints],
          spatialReference: this.view.spatialReference
        }));

        toolInfo = null;
      };

      const dblclick = this.makeSingleDoubleClickHandler(click, doubleClick);

      this._canvasHandlers.push({
        type: "click",
        handler: dblclick
      });

      this._canvasHandlers.push({
        type: "mousemove",
        handler: mouseMove
      });

      this._canvasHandlers.push({
        type: "dblclick",
        handler: dblclick
      });


      this._canvas.addEventListener("click", dblclick);
      this._canvas.addEventListener("mousemove", mouseMove);
      this._canvas.addEventListener("dblclick", dblclick);
    };

    //--------------------------
    // Activate Polygon Tool
    //--------------------------
    activatePolygon = () => {
      let toolInfo: ToolInfo;
      let toolActive: boolean;

      const context = this._context;

      //set context draw styles
      context.strokeStyle = this.fillStyle.outline.color;
      context.lineWidth = this.fillStyle.outline.width;

      context.fillStyle = this.fillStyle.color;

      const click = (evt: MouseEvent) => {
        //console.log("poly click");
        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        if (!toolActive) {
          this.setTooltipActive(false);
          toolActive = true;

          toolInfo = {
            type: "polygon",
            screenPoints: [],
            mapPoints: []
          };
        }

        toolInfo.screenPoints.push([clickX, clickY]);

        const mapPoint = this.screenCoordsToMapPoint(clickX, clickY);
        toolInfo.mapPoints.push([mapPoint.x, mapPoint.y]);

        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        if (toolInfo.screenPoints.length > 0) {
          context.beginPath();
          let currentPoint = toolInfo.screenPoints[0];
          context.moveTo(currentPoint[0], currentPoint[1]);

          for (let i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
            currentPoint = toolInfo.screenPoints[i];
            context.lineTo(currentPoint[0], currentPoint[1]);
          }

          context.stroke();
        }
      };

      const mouseMove = (evt: MouseEvent) => {
        if (!toolActive) {
          return;
        }

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        const context = this._context;
        context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        context.beginPath();
        let currentPoint = toolInfo.screenPoints[0];
        context.moveTo(currentPoint[0], currentPoint[1]);

        for (let i = 1, n = toolInfo.screenPoints.length; i < n; i++) {
          currentPoint = toolInfo.screenPoints[i];
          context.lineTo(currentPoint[0], currentPoint[1]);
        }

        context.lineTo(clickX, clickY);
        context.stroke();
      };

      const doubleClick = (evt: MouseEvent) => {
        //console.log("poly double click");
        click(evt);

        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        toolActive = false;
        this._set("latestMapShape", new Polygon({
          rings: [toolInfo.mapPoints],
          spatialReference: this.view.spatialReference
        }));

        toolInfo = null;
      };

      const dblclick = this.makeSingleDoubleClickHandler(click, doubleClick);

      this._canvasHandlers.push({
        type: "click",
        handler: dblclick
      });

      this._canvasHandlers.push({
        type: "mousemove",
        handler: mouseMove
      });

      this._canvasHandlers.push({
        type: "dblclick",
        handler: dblclick
      });

      this._canvas.addEventListener("click", dblclick);
      this._canvas.addEventListener("mousemove", mouseMove);
      this._canvas.addEventListener("dblclick", dblclick);
    };


    //--------------------------
    // Activate Rectangle Tool
    //--------------------------

    activateRectangle = () => {
      let rectangle: any;
      let toolActive: boolean;

      //set context draw styles
      this._context.fillStyle = this.fillStyle.color;
      this._context.strokeStyle = this.fillStyle.outline.color;
      this._context.lineWidth = this.fillStyle.outline.width;

      const mouseDown = (evt: MouseEvent) => {
        this.setTooltipActive(false);

        rectangle = {
          startX: evt.x - this._canvasOffset.x,
          startY: evt.y - this._canvasOffset.y,
          rect: {}
        };

        toolActive = true;
      };

      const mouseMove = (evt: MouseEvent) => {
        if (!toolActive) {
          return;
        }

        const clickX = evt.x - this._canvasOffset.x;
        const clickY = evt.y - this._canvasOffset.y;

        const x = Math.min(clickX, rectangle.startX),
          y = Math.min(clickY, rectangle.startY),
          w = Math.abs(clickX - rectangle.startX),
          h = Math.abs(clickY - rectangle.startY);

        if (!w || !h) {
          return;
        }

        rectangle.rect = {
          x: x,
          y: y,
          w: w,
          h: h
        };

        const context = this._context;
        const canvas = this._canvas;

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.fillRect(x, y, w, h);
        context.strokeRect(x, y, w, h);
      };

      const mouseUp = (evt: MouseEvent) => {
        mouseMove(evt);

        toolActive = false;

        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

        //make lower left point and upper right point of extent
        const rect = rectangle.rect;
        const ll = this.screenCoordsToMapPoint(rect.x, rect.y + rect.h);
        const ur = this.screenCoordsToMapPoint(rect.x + rect.w, rect.y);

        this._set("latestMapShape", new Extent({
          xmin: ll.x,
          ymin: ll.y,
          xmax: ur.x,
          ymax: ur.y,
          spatialReference: this.view.spatialReference
        }));
      };

      this._canvasHandlers.push({
        type: "mousedown",
        handler: mouseDown
      });

      this._canvasHandlers.push({
        type: "mousemove",
        handler: mouseMove
      });

      this._canvasHandlers.push({
        type: "mouseup",
        handler: mouseUp
      });

      this._canvas.addEventListener("mousedown", mouseDown);
      this._canvas.addEventListener("mousemove", mouseMove);
      this._canvas.addEventListener("mouseup", mouseUp);
    };


    //--------------------------------------------------
    // Make an event handler that takes into
    // account single and double click on same element
    //--------------------------------------------------
    makeSingleDoubleClickHandler(singleHandler: any, doubleHandler: any) {
      const handler = (evt: MouseEvent) => {
        const elem = evt.target as Element;
        const attribName = "data-dbl-click";

        if (elem.getAttribute(attribName) === null) {
          elem.setAttribute(attribName, "1");
          setTimeout(() => {

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
    }


    //--------------------------
    // Activate/Deactivate Tooltip
    //--------------------------
    setTooltipActive(active: boolean, shape?: string) {
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
    }

    //--------------------------
    // Convert degrees to radians
    //--------------------------

    //Used for drawing arcs
    degreesToRadians(degrees: number): number {
      return (Math.PI / 180) * degrees;
    }


    screenCoordsToMapPoint(x: number, y: number): ScreenPoint {
      const point = this.view.toMap(new ScreenPoint({
        x: x,
        y: y
      }));

      return new ScreenPoint({
        x: point.x,
        y: point.y
      });
    }
  }
}


