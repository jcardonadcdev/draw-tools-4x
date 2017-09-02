import MapView = require("esri/views/MapView");

import Point = require("esri/geometry/Point");
import Multipoint = require("esri/geometry/Multipoint");
import Polyline = require("esri/geometry/Polyline");
import Polygon = require("esri/geometry/Polygon");
import Extent = require("esri/geometry/Extent");
import Circle = require("esri/geometry/Circle");

declare namespace DrawToolInterfaces {
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

