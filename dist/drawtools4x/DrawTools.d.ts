/// <reference types="arcgis-js-api" />
import Accessor = require("esri/core/Accessor");
import MapView = require("esri/views/MapView");
import ScreenPoint = require("esri/geometry/ScreenPoint");
export declare namespace drawtools4x {
    interface LineStyle {
        width: number;
        color: string;
    }
    interface FillStyle {
        color?: string;
        outline: LineStyle;
    }
    interface PointStyle {
        color: string;
        size: number;
        outline?: LineStyle;
    }
    interface DrawToolProperties {
        view: MapView;
        showTooltip?: boolean;
        pointStyle?: PointStyle;
        lineStyle?: LineStyle;
        fillStyle?: FillStyle;
    }
    const DrawTools_base: typeof Accessor;
    class DrawTools extends DrawTools_base {
        constructor(params: DrawToolProperties);
        initialize(): void;
        _canvas: HTMLCanvasElement;
        _context: CanvasRenderingContext2D;
        _tooltipContainer: HTMLElement;
        _tooltips: {
            point: string;
            multipoint: string;
            line: string;
            polyline: string;
            polygon: string;
            rectangle: string;
        };
        _tooltipMouseMove: (evt: MouseEvent) => void;
        _tooltipMouseEnter: () => void;
        _tooltipMouseLeave: () => void;
        _canvasOffset: {
            x: number;
            y: number;
        };
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
        latestMapShape: any;
        /**
         * The style to use for drawing points. This style is
         * used to draw the multipoint locations as the mouse is clicked.
         * @type {PointStyle}
         */
        pointStyle: PointStyle;
        /**
         * The style to use for drawing lines. This style is
         * used to draw the line and polygon paths as the mouse is clicked.
         * @type {LineStyle}
         */
        lineStyle: LineStyle;
        /**
         * The style to use for drawing fills. This style is
         * used to draw the polygon and rectangle locations as the
         * mouse is clicked or dragged.
         * @type {FillStyle}
         */
        fillStyle: FillStyle;
        mapViewResized: (evt: any) => void;
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
        activatePoint: () => void;
        activateMultipoint: () => void;
        activateLine: () => void;
        activatePolyline: () => void;
        activatePolygon: () => void;
        activateRectangle: () => void;
        makeSingleDoubleClickHandler(singleHandler: any, doubleHandler: any): (evt: MouseEvent) => void;
        setTooltipActive(active: boolean, shape?: string): void;
        degreesToRadians(degrees: number): number;
        screenCoordsToMapPoint(x: number, y: number): ScreenPoint;
    }
}
