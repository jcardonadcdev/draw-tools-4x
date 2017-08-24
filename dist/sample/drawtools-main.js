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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHJhd3Rvb2xzLW1haW4uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zYW1wbGUvZHJhd3Rvb2xzLW1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7SUFlQSxDQUFDO1FBQ0MsSUFBSSxVQUFrQixDQUFDO1FBQ3ZCLElBQUksT0FBZ0IsQ0FBQztRQUVyQixJQUFNLFlBQVksR0FBRyxrQkFBa0IsQ0FBQyxRQUFRLENBQUM7WUFDL0MsTUFBTSxFQUFFLFNBQVM7WUFDakIsT0FBTyxFQUFFLGVBQWU7WUFDeEIsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDO1lBQzFCLE1BQU0sRUFBRSxFQUFFO1lBQ1YsT0FBTyxFQUFFLENBQUM7WUFDVixTQUFTLEVBQUUsQ0FBQztZQUNaLFNBQVMsRUFBRSxDQUFDO1lBQ1osU0FBUyxFQUNQO2dCQUNFLE9BQU8sRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQztnQkFDN0IsT0FBTyxFQUFFLENBQUM7YUFDWDtTQUNKLENBQUMsQ0FBQztRQUVILElBQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztZQUMzQyxNQUFNLEVBQUcsU0FBUztZQUNsQixPQUFPLEVBQUcsY0FBYztZQUN4QixPQUFPLEVBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUM7WUFDM0IsT0FBTyxFQUFHLENBQUM7U0FDWixDQUFDLENBQUM7UUFFSCxJQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7WUFDM0MsTUFBTSxFQUFHLFNBQVM7WUFDbEIsT0FBTyxFQUFHLGNBQWM7WUFDeEIsT0FBTyxFQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQzFCLFNBQVMsRUFBRztnQkFDVixPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsR0FB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