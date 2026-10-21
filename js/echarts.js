import * as echarts from 'https://esm.sh/echarts@5.5.1/core';
import { LineChart, GaugeChart } from 'https://esm.sh/echarts@5.5.1/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  VisualMapComponent
} from 'https://esm.sh/echarts@5.5.1/components';
import { CanvasRenderer } from 'https://esm.sh/echarts@5.5.1/renderers';

echarts.use([LineChart, GaugeChart, GridComponent, TooltipComponent, LegendComponent, MarkLineComponent, VisualMapComponent, CanvasRenderer]);

export { echarts };
