# draw-tools-4x
A simple set of draw tools for the 4.x Esri JavaScript API. These are meant to be used only until the official draw tools are released by Esri.

## Description

The tools consist of one *javascript* and one *css* file. Using the tools, user input on a map can be captured as geometries that can then be used in other parts of an application. The tools are written in *TypeScript*, but a compiled version is available in the `dist` folder.

## Instructions

### Using the tools in an application
* Clone or download this repository
* Copy the contents of the `dist` directory into a directory of your web application.

* Copy the `dist/drawtools4x/DrawTools.js` and `src/css/drawtools.css` into directories in your web application.
* Reference the `drawtools.css` in your application

#### Using TypeScript
* Reference the `drawtools-js-4.d.ts` declaration file using `/// <reference path="path/to/file" />`. 
* Create a new instance of the ***DrawTools*** passing in a `MapView` in the constructor.
* Use the `activate` / `deactivate` methods to enable and disable drawing on the view

#### Using JavaScript
* Reference the `drawtools4x/DrawTools.js` file in a require statement.
* Create a new instance of the ***DrawTools*** passing in a `MapView` in the constructor.
* Use the `activate` / `deactivate` methods to enable and disable drawing on the view

See the *samples* directory for a sample application written in TypeScript and in JavaScript. Note the `dojoConfig` variable in a script tag. It is needed to access modules locally and from the esri javascript api hosted on a CDN.

### Compiling the TypeScript
* You'll need to download the **dev-dependencies** using *npm*. From a command line in the root of the project run `npm install`. This downloads the necessary node modules.
* The following scripts can be run to compile different pieces:
  * `npm run build-sample` - Compiles `sample/typescript/drawtools-main.ts`. After running this, you can access the TypeScript sample app.
  * `npm run build-all` - Compiles the file listed above as well as `src/drawtools4x/DrawTools.ts`. The DrawTools.js file gets put in `dist/drawtools4x/DrawTools.js`. In addition, a declaration file gets created at `dist/drawtools-js-4.d.ts`. It has typings for the DrawTools and the interfaces.
  * `npm run watch` - Compiles the same files above and watches for changes to `DrawTools.ts` and `drawtools-main.ts` and recompiles when there are changes.

## Documentation

### Constructor
```js
new DrawTools(properties)
```
  `properties` is an object. See the ***Properties*** list below
  
### Properties

| Name      | Type      | Summary                     |
| ----      | ------    | -------                     |
| validShapes  **(static)** | Object | Geometries supported by the draw tools. Keys are the geometry type and values are a boolean |
| view  **(read only)** | MapView | The [MapView](https://developers.arcgis.com/javascript/latest/api-reference/esri-views-MapView.html) associated with the DrawTools |
| activeTool   **(read only** | string |  The currently active tool type. See below for a summary of geometry types |
| showTooltip | boolean | Flag for displaying drawing tooltip |
| latestMapShape | ArcGIS JavaScript API [Geometry](https://developers.arcgis.com/javascript/latest/api-reference/esri-geometry-Geometry.html) | The last geometry created by the draw tools. This property can be watched to capture when a geometry has been drawn | 
| pointStyle | Object | The style to use for drawing points. See below for properties. |
| lineStyle | Object | The style to use for drawing lines. See below for properties. |
| fillStyle | Object | The style to use for drawing fills of rectangles and polygons. See below for properties. |


**Point Style Properties**
  
| Name | Summary |
| --- | --- |
| color | Fill color. A valid color such as `"blue"`, or `"rgb(255,0,0)"` or `"#dcdcdc"` |
| size | Number of pixels |
| outline | An object with `color` and `width` properties. `color` is a valid color. Width is a number.

**Line Style Properties**
  
| Name | Summary |
| --- | --- |
| color | A valid color such as `"blue"`, or `"rgb(255,0,0)"` or `"#dcdcdc"` |
| width | A number |

**Fill Style Properties**
  
| Name | Summary |
| --- | --- |
| color | A valid color such as `"blue"`, or `"rgb(255,0,0)"` or `"#dcdcdc"` |
| outline | An object with the same properties ast the point outline |


### Methods

***activate(geometryType)*** - Activates the tool for the supplied geometry type. When draw tools are active, the map navigation is disabled.

    geometryType: A string. Valid values are *point*, *line*, *polyline*, *polygon*, and *rectangle*
    returns: A Promise that resolves with the `geometryType` string or rejects if the geometry type is invalid
    
***deactivate()*** - Deactivates the tools. Map navigation is re-enabled

    
