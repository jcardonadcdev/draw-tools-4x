import MapView = require("esri/views/MapView");

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
}

export = DrawToolInterfaces;

