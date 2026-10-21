import { createSimulator, STEP_MS } from './data.js';
import { $ } from './utils.js';
import { initHeader } from './header.js';
import { createKpis } from './kpi.js';
import { createMeterPanel } from './meters.js';
import { createTopology } from './topology.js';
import { createPsChart } from './chart.js';
import { createPcsPanel } from './pcs.js';
import { createBmsPanel } from './bms.js';
import { createAlarmCenter } from './alarm.js';

const sim = createSimulator();

initHeader({ onSimulate: () => { sim.simulateBackflow(20); } });

const modules = [
  ['KPI', createKpis($('#kpis'))],
  ['电表', createMeterPanel()],
  ['拓扑', createTopology()],
  ['趋势图', createPsChart()],
  ['储能PCS', createPcsPanel()],
  ['BMS', createBmsPanel()],
  ['告警', createAlarmCenter({ onAck: () => sim.ack() })]
];

function renderAll() {
  modules.forEach(([name, m]) => {
    try {
      m.update(sim.state);
    } catch (err) {
      console.error(`模块渲染失败[${name}]: ${err && err.message ? err.message : String(err)}\n${err && err.stack ? err.stack : ''}`);
    }
  });
}

renderAll();

setInterval(() => {
  sim.step(Date.now());
  renderAll();
}, STEP_MS);
