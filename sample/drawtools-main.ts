import { drawtools4x } from "src/DrawTools";

import Map = require("esri/Map");
import MapView = require("esri/views/MapView");

import BaseMap = require("esri/Basemap");

import SimpleMarkerSymbol = require("esri/symbols/SimpleMarkerSymbol");
import SimpleLineSymbol = require("esri/symbols/SimpleLineSymbol");
import SimpleFillSymbol = require("esri/symbols/SimpleFillSymbol");

import Graphic = require("esri/Graphic");

import "dojo/domReady!";

(function initialize() {
  let sketchType: string;
  let mapView: MapView;

  const markerSymbol = SimpleMarkerSymbol.fromJSON({
    "type": "esriSMS",
    "style": "esriSMSCircle",
    "color": [76, 115, 0, 150],
    "size": 12,
    "angle": 0,
    "xoffset": 0,
    "yoffset": 0,
    "outline":
      {
        "color": [255, 255, 255, 205],
        "width": 1
      }
  });

  const lineSymbol = SimpleLineSymbol.fromJSON({
    "type" : "esriSLS",
    "style" : "esriSLSSolid",
    "color" : [76, 115, 0, 175],
    "width" : 2
  });

  const fillSymbol = SimpleFillSymbol.fromJSON({
    "type" : "esriSFS",
    "style" : "esriSFSSolid",
    "color" : [76, 115, 0, 80],
    "outline" : {
      "color": [76, 115, 0, 205],
      "width": 1
    }
  });

  //make mapview
  initializeMap();

  //set up src
  initializeTools();

  let drawTools: drawtools4x.DrawTools;

  function initializeMap() {

    const map = new Map({
      basemap: BaseMap.fromId("gray")
    });

    mapView = new MapView({
      map: map,
      container: "map-div"
    });

    mapView.then(() => {
      const props: drawtools4x.DrawToolProperties = {
        view: mapView,
        fillStyle: {
          color: "rgba(255,0,0,0.1)",
          outline: {
            color: "rgb(255,0,0)",
            width: 2
          }
        }
      };

      drawTools = new drawtools4x.DrawTools(props);

      drawTools.watch("latestMapShape", (shape) => {
        drawResult(shape);
        clearActiveTool();
      });
    });
  }

  function initializeTools() {
    const buttons = document.querySelectorAll("[data-tool-type]");

    let i: number;
    const n = buttons.length;

    for (i = 0; i < n; i++) {
      const b = buttons.item(i);
      b.addEventListener("click", handleToolClick);
      b.removeAttribute("disabled");
    }
  }

  function handleToolClick(evt: MouseEvent) {
    const elem = evt.target as Element;
    const toolType = elem.getAttribute("data-tool-type");

    const sameTool = toolType === sketchType;

    clearActiveTool();

    if (toolType === "clear") {
      mapView.graphics.removeAll();
    }
    else if (!sameTool) {
      elem.classList.add("tool-active");

      const body = document.querySelector("body");
      body.classList.add("draw-in-progress");

      sketchType = toolType;

      drawTools.activate(sketchType)
        .then((shape) => {
          //console.log("tool activated: ", shape);
        })
        .otherwise((err) => {
          console.log("error activating tool: ", err);
          clearActiveTool();
        });
    }
  }

  function clearActiveTool() {
    const body = document.querySelector("body");
    body.classList.remove("draw-in-progress");

    const buttons = document.querySelectorAll("[data-tool-type]");

    let i: number;
    const n = buttons.length;

    for (i = 0; i < n; i++) {
      const b = buttons.item(i);
      b.classList.remove("tool-active");
    }

    sketchType = null;
    drawTools.deactivate();
  }

  function drawResult(geometry: any) {
    let s: any;

    if (geometry.type === "point" || geometry.type === "multipoint") {
      s = markerSymbol;
    }
    else if (geometry.type === "polyline") {
      s = lineSymbol;
    }
    else if (geometry.type === "polygon" || geometry.type === "extent") {
      s = fillSymbol;
    }

    if (s) {
      mapView.graphics.add(new Graphic({
        geometry: geometry,
        symbol: s
      }));
    }
  }
})();
