define(["require", "exports", "src/DrawTools", "esri/Map", "esri/views/MapView", "esri/Basemap", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Graphic", "dojo/domReady!"], function (require, exports, DrawTools_1, Map, MapView, BaseMap, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Graphic) {
    Object.defineProperty(exports, "__esModule", { value: true });
    (function initialize() {
        var sketchType;
        var mapView;
        var markerSymbol = SimpleMarkerSymbol.fromJSON({
            "type": "esriSMS",
            "style": "esriSMSCircle",
            "color": [76, 115, 0, 150],
            "size": 12,
            "angle": 0,
            "xoffset": 0,
            "yoffset": 0,
            "outline": {
                "color": [255, 255, 255, 205],
                "width": 1
            }
        });
        var lineSymbol = SimpleLineSymbol.fromJSON({
            "type": "esriSLS",
            "style": "esriSLSSolid",
            "color": [76, 115, 0, 175],
            "width": 2
        });
        var fillSymbol = SimpleFillSymbol.fromJSON({
            "type": "esriSFS",
            "style": "esriSFSSolid",
            "color": [76, 115, 0, 80],
            "outline": {
                "color": [76, 115, 0, 205],
                "width": 1
            }
        });
        //make mapview
        initializeMap();
        //set up src
        initializeTools();
        var drawTools;
        function initializeMap() {
            var map = new Map({
                basemap: BaseMap.fromId("gray")
            });
            mapView = new MapView({
                map: map,
                container: "map-div"
            });
            mapView.then(function () {
                var props = {
                    view: mapView,
                    fillStyle: {
                        color: "rgba(255,0,0,0.1)",
                        outline: {
                            color: "rgb(255,0,0)",
                            width: 2
                        }
                    }
                };
                drawTools = new DrawTools_1.drawtools4x.DrawTools(props);
                drawTools.watch("latestMapShape", function (shape) {
                    drawResult(shape);
                    clearActiveTool();
                });
            });
        }
        function initializeTools() {
            var buttons = document.querySelectorAll("[data-tool-type]");
            var i;
            var n = buttons.length;
            for (i = 0; i < n; i++) {
                var b = buttons.item(i);
                b.addEventListener("click", handleToolClick);
                b.removeAttribute("disabled");
            }
        }
        function handleToolClick(evt) {
            var elem = evt.target;
            var toolType = elem.getAttribute("data-tool-type");
            var sameTool = toolType === sketchType;
            clearActiveTool();
            if (toolType === "clear") {
                mapView.graphics.removeAll();
            }
            else if (!sameTool) {
                elem.classList.add("tool-active");
                var body = document.querySelector("body");
                body.classList.add("draw-in-progress");
                sketchType = toolType;
                drawTools.activate(sketchType)
                    .then(function (shape) {
                    //console.log("tool activated: ", shape);
                })
                    .otherwise(function (err) {
                    console.log("error activating tool: ", err);
                    clearActiveTool();
                });
            }
        }
        function clearActiveTool() {
            var body = document.querySelector("body");
            body.classList.remove("draw-in-progress");
            var buttons = document.querySelectorAll("[data-tool-type]");
            var i;
            var n = buttons.length;
            for (i = 0; i < n; i++) {
                var b = buttons.item(i);
                b.classList.remove("tool-active");
            }
            sketchType = null;
            drawTools.deactivate();
        }
        function drawResult(geometry) {
            var s;
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
});
