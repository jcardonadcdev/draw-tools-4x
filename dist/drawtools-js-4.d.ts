declare module 'drawtools4x/interfaces/draw-tool-interfaces' {
	import MapView = require("esri/views/MapView");

	import Point = require("esri/geometry/Point");
	import Multipoint = require("esri/geometry/Multipoint");
	import Polyline = require("esri/geometry/Polyline");
	import Polygon = require("esri/geometry/Polygon");
	import Extent = require("esri/geometry/Extent");
	import Circle = require("esri/geometry/Circle"); namespace DrawToolInterfaces {
	  //Interfaces for draw styles
	  interface LineStyle {
	    width: number;
	    color: string;
	  }

	  interface FillStyle {
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

	  type GeometryType = "point" |
	    "multipoint" |
	    "polyline" |
	    "polygon" |
	    "extent" |
	    "circle";

	  interface ScreenCoordinate {
	    x: number;
	    y: number;
	  }

	  export interface ScreenMultipoint {
	    points: number[][];
	  }

	  export interface ScreenExtent {
	    topCorner: ScreenCoordinate;
	    width: number;
	    height: number;
	  }

	  export interface ScreenLine {
	    points: number[][];
	  }

	  export interface ScreenPolygon {
	    points: number[][];
	  }

	  export interface ScreenCircle {
	    center: ScreenCoordinate;
	    radius: number;
	  }

	  export interface ScreenGeometry {
	    type: GeometryType;
	    shape: ScreenCoordinate | ScreenMultipoint | ScreenLine |
	      ScreenPolygon | ScreenExtent |
	      ScreenCircle;
	  }

	  type MapGeometryType = Point |
	    Multipoint |
	    Polyline |
	    Polygon |
	    Extent |
	    Circle;

	  export interface DrawResult {
	    screenGeometry: ScreenGeometry;
	    mapGeometry: Point | Multipoint |
	      Polyline | Polygon |
	      Extent | Circle;
	  }
	}

	export = DrawToolInterfaces;


}
declare module 'drawtools4x/DrawTools' {
	/// <reference types="arcgis-js-api" />
	import Accessor = require("esri/core/Accessor");
	import MapView = require("esri/views/MapView");
	import * as DrawToolInterfaces from "interfaces/draw-tool-interfaces"; const DrawTools_base: typeof Accessor; class DrawTools extends DrawTools_base {
	    constructor(params: DrawToolInterfaces.DrawToolProperties);
	    initialize(): void;
	    private _canvas;
	    private _context;
	    private _tooltipContainer;
	    private _tooltips;
	    private _tooltipMouseMove;
	    private _tooltipMouseEnter;
	    private _tooltipMouseLeave;
	    private _canvasOffset;
	    _canvasHandlers: any[];
	    /**
	     * Geometries supported by the draw tools
	     * @name validShapes
	     * @static
	     * @type {*}
	     */
	    static validShapes: {
	        rectangle: boolean;
	        polyline: boolean;
	        polygon: boolean;
	        line: boolean;
	        point: boolean;
	        multipoint: boolean;
	        circle: boolean;
	    };
	    /**
	     * The MapView using the draw tools
	     * @name view
	     * @type {MapView}
	     * @readonly
	     */
	    readonly view: MapView;
	    /**
	     * The currently active tool type. Values are the same as the
	     * key values in the `validShapes` property
	     * @name activeTool
	     * @readonly
	     * @type {string}
	     */
	    readonly activeTool: string;
	    /**
	     * Flag for displaying drawing tooltip
	     * @name showTooltip
	     * @type {boolean}
	     */
	    showTooltip: boolean;
	    /**
	     * The last geometry created by the draw tools. This property
	     * can be watched to capture when a geometry has been drawn.
	     * The property is one of the esri/geometry/Geometry types
	     * @name latestMapShape
	     * @type {*}
	     */
	    latestMapShape: DrawToolInterfaces.DrawResult;
	    /**
	     * The style to use for drawing points. This style is
	     * used to draw the multipoint locations as the mouse is clicked.
	     * @type {PointStyle}
	     */
	    pointStyle: DrawToolInterfaces.PointStyle;
	    /**
	     * The style to use for drawing lines. This style is
	     * used to draw the line and polygon paths as the mouse is clicked.
	     * @type {LineStyle}
	     */
	    lineStyle: DrawToolInterfaces.LineStyle;
	    /**
	     * The style to use for drawing fills. This style is
	     * used to draw the polygon and rectangle locations as the
	     * mouse is clicked or dragged.
	     * @type {FillStyle}
	     */
	    fillStyle: DrawToolInterfaces.FillStyle;
	    private mapViewResized;
	    /**
	     * Activates the tool for the supplied geometry type.
	     * Valid values are the same as the
	     * key values in the `validShapes` property. When draw tools
	     * are active, the map navigation is disabled
	     * @param {string} shape
	     * @returns {IPromise<string>} Resolves to the input shape or rejects if the shape is not supported
	     */
	    activate(shape: string): IPromise<string>;
	    /**
	     * Deactivates the tools. Map navigation is re-enabled
	     */
	    deactivate(): void;
	    private activatePoint;
	    private activateMultipoint;
	    private activateLine;
	    private activatePolyline;
	    private activatePolygon;
	    private activateRectangle;
	    private activateCircle;
	    private makeSingleDoubleClickHandler(singleHandler, doubleHandler);
	    private setTooltipActive(active, shape?);
	    private degreesToRadians(degrees);
	    private screenCoordsToMapPoint(x, y);
	}
	export = DrawTools;

}
// http://wiki.commonjs.org/wiki/Modules/1.1
declare module "module" {
  export var id: string;
}
declare module "dojo/i18n!*" {
  const i18n: any;
  export = i18n;
}

declare module "dojo/text!*" {
  const text: string;
  export = text;
}
/// <reference path="./module.d.ts" />
/// <reference path="./plugins.d.ts" />

