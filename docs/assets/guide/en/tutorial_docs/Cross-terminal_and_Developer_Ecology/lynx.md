# Lynx

Lynx is a high-performance cross-end framework for quickly building Native views using the Web technology stack in Bytes. VChart also provides support for the chart rendering capabilities of this framework.

## How to get VChart

### npm package

You can install the vchart dependency package directly in the lynx project: `@visactor/vchart`.

### Manually import script

You can also manually reference VChart's umd packaged product, which you can obtain through the following channels:

1. Obtain [packages/block-vchart/block/vchart/index.js](https://github.com/VisActor/VChart/blob/main/packages/block-vchart/block/vchart/index. js), we will update it every time we send a package
2. Get it from the following free CDN

```html
<!-- unpkg -->
<script src="https://unpkg.com/@visactor/vchart/build/index.min.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/@visactor/vchart/build/index.min.js"></script>
```

## how to use

Below we will introduce how to use VChart on Feishu widgets from three parts: `js`, `ttml`, and `ttss`.

### index.ttml

Three canvases need to be declared, and pay attention to the order of declaration.

- `bar_hidden_canvas` hidden canvas, declared in the first, is used for some internal picking logic
- `bar_draw_canvas` draws canvas, the second statement
- `bar_tooltip_canvas` is used to draw the canvas of the tooltip. The tooltip of the cross-end environment is drawn using the canvas.

```html
<view class="chart-space">
  <!-- canvas order is important -->
  <canvas
    name="bar_hidden_canvas"
    id="bar_hidden_canvas"
    user-interaction-enabled="{{false}}"
    class="cs-canvas cs-canvas-hidden"
  >
  </canvas>
  <canvas
    class="cs-canvas"
    bindtouchstart="bindChartEvent"
    bindtouchmove="bindChartEvent"
    bindtouchend="bindChartEvent"
    name="bar_draw_canvas"
    id="bar_draw_canvas"
  >
  </canvas>
  <canvas
    name="bar_tooltip_canvas"
    id="bar_tooltip_canvas"
    user-interaction-enabled="{{false}}"
    class="cs-tooltip-canvas"
  >
  </canvas>
</view>
```

### index.js

Create a VChart instance in this file. Because VChart is internally compatible with the lynx environment, its use is basically the same as on the PC. You only need to pay attention to two points:

1. Necessary environment parameters need to be declared in the constructor of VChart

```ts
const chartInstance = new VChart(spec, {
  mode: 'lynx', // Tip: Cross-end environment needs to manually pass in mode
  // Cross-end parameters
  modeParams: {
    domref: domRef, // Canvas node for chart drawing
    force: true, // Whether to force the use of canvas for drawing
    canvasIdLists: [`${item.id}_draw_canvas`, `${item.id}_tooltip_canvas`, `${item.id}_hidden_canvas`], // canvasId list
    tooltipCanvasId: `${item.id}_tooltip_canvas`, // tooltip canvasId
    freeCanvasIdx: 1 // Free canvas index
  },
  dpr: pixelRatio, // Tip: Cross-end environment needs to manually pass in dpr
  renderCanvas: `${item.id}_draw_canvas` // Declare the canvasId used for drawing
});
```

2. Regarding events, users need to bind events to the canvas (canvas used for drawing) element themselves, and then manually dispatch events in the event listening function to trigger events inside ChartSpace.

```ts
bindChartEvent(event) {
   const id = event.target.id.split("_")[0];
   const targetChart = this.data.chartList.find(x => x.id === id);
   const chartInstance = targetChart?.chart;
   if (chartInstance) {
     event.target = chartInstance.getCanvas(); // Tip: Must be set
     chartInstance.getStage().window.dispatchEvent(event);
   }
},
```

3. In a cross-end environment, the asynchronous rendering method `renderAsync()` may have some position problems. It is recommended to use VChart's synchronous rendering method `renderSync()`.

The following is the completed code related to index.js:

```ts
import barSpec from './data/bar';
import ChartSpace from '@visactor/vchart';
import mapJson from './data/map-data-china';

Card({
  data: {
    chartList: [
      {
        id: 'bar',
        spec: barSpec,
        chart: undefined
      }
    ]
  },
  onLoad: function () {
    // If you need to use a map, you need to register the map first
    ChartSpace.registerMap('china', mapJson, {
      type: 'geojson'
    });
    this.init();
  },

  init() {
    this.data.chartList.forEach(item => {
      this.createSelectorQuery()
        .select(`#${item.id}_draw_canvas`)
        .invoke({
          method: 'boundingClientRect',
          success: domRef => {
            if (!domRef) {
              console.error(`#${item.id} canvas not found`);
              return;
            }
            domRef.id = item.id;
            const pixelRatio = SystemInfo.pixelRatio;

            const chartInstance = new ChartSpace(
              {
                width: domRef.width, // Tip: Cross-end environment needs to manually pass in the width and height
                height: domRef.height,
                ...item.spec
              },
              {
                mode: 'lynx', // Tip: Cross-end environment needs to manually pass in mode
                // Cross-end parameters
                modeParams: {
                  domref: domRef, // Canvas node for chart drawing
                  force: true, // Whether to force the use of canvas for drawing
                  canvasIdLists: [`${item.id}_draw_canvas`, `${item.id}_tooltip_canvas`, `${item.id}_hidden_canvas`], // canvasId list
                  tooltipCanvasId: `${item.id}_tooltip_canvas`, // tooltip canvasId
                  freeCanvasIdx: 1 // Free canvas index
                },
                dpr: pixelRatio, // Tip: Cross-end environment needs to manually pass in dpr
                renderCanvas: `${item.id}_draw_canvas` // Declare the canvasId used for drawing
                // animation: false
              }
            );
            item.chart = chartInstance;

            if (item.events) {
              item.events.forEach(event => {
                chartInstance.on(event.type, { source: event.element }, event.handler);
              });
            }
            chartInstance.renderAsync();
          },
          fail: res => {
            console.log('res:', res);
          }
        })
        .exec();
    });
  },

  bindChartEvent(event) {
    const id = event.target.id.split('_')[0];
    const targetChart = this.data.chartList.find(x => x.id === id);
    const chartInstance = targetChart?.chart;
    if (chartInstance) {
      event.target = chartInstance.getCanvas(); // Tip: Must be set
      chartInstance.getStage().window.dispatchEvent(event);
    }
  }
});
```