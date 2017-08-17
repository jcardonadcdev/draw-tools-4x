define(["require", "exports", "src/DrawTools", "esri/Map", "esri/views/MapView", "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "esri/Graphic", "dojo/domReady!"], function (require, exports, DrawTools_1, Map, MapView, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Graphic) {
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
                basemap: "gray"
            });
            mapView = new MapView({
                map: map,
                container: "map-div"
            });
            mapView.then(function () {
                drawTools = new DrawTools_1.DrawTools({
                    view: mapView
                });
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