import type { BmsFieldMeta, CabPhase, MeterMeta, PcsFieldMeta, PhaseKey } from './types';

export const STEP_MS = 2000;
export const ESS_REFRESH_MS = 10000;
export const HISTORY_MS = 3600 * 1000;
export const CELL_COUNT = 224;
export const TEMP_COUNT = 64;
export const ESS_CAPACITY = 215;
export const CONTROL_MARGIN = 8;
export const TEMP_WARN = 32.5;
export const SAFE_MARGIN = 15;

export const METERS: MeterMeta[] = [
  { id: 'grid', name: '市电电表', short: '市电', color: '#2ee59a', icon: 'ri-government-line', device: '市电进线' },
  { id: 'ess', name: '储能电表', short: '储能', color: '#3ad4ff', icon: 'ri-battery-2-charge-line', device: '储能充放电设备' },
  { id: 'cab1', name: '配电柜1电表', short: '配电柜1', color: '#8ef06a', icon: 'ri-server-line', device: '测试电池充放电' },
  { id: 'cab2', name: '配电柜2电表', short: '配电柜2', color: '#f5c15a', icon: 'ri-server-line', device: '测试电池充放电' },
  { id: 'cab3', name: '配电柜3电表', short: '配电柜3', color: '#7eb6ff', icon: 'ri-server-line', device: '测试电池充放电' }
];

export const PHASES: { key: PhaseKey; name: string; color: string }[] = [
  { key: 'a', name: 'A相', color: '#f5c15a' },
  { key: 'b', name: 'B相', color: '#2ee59a' },
  { key: 'c', name: 'C相', color: '#ff6b6b' }
];

export const PHASE_TEXT: Record<CabPhase, string> = { chg: '充电测试', dis: '放电测试', rest: '静置' };

export const PCS_FIELDS: PcsFieldMeta[] = [
  { key: 'time', label: '最新时间' },
  { key: 'voltage', label: '采样电压/V', d: 1 },
  { key: 'current', label: '采样电流/A', d: 1 },
  { key: 'power', label: '当前功率/KW', d: 2 },
  { key: 'chgAh', label: '充电安时/AH', d: 2 },
  { key: 'disAh', label: '放电安时/AH', d: 2 },
  { key: 'chgWh', label: '充电瓦时/WH', d: 0 },
  { key: 'disWh', label: '放电瓦时/WH', d: 0 },
  { key: 'step', label: '工步信息' },
  { key: 'status', label: '当前状态' },
  { key: 'mode', label: '工作模式' },
  { key: 'fault', label: '故障信息' },
  { key: 'pwmFault', label: 'PWM故障信息' },
  { key: 'dcdcFault', label: 'DCDC故障信息' }
];

export const BMS_FIELDS: BmsFieldMeta[] = [
  { key: 'totalV', label: '总电压', unit: 'V', d: 1, icon: 'ri-flashlight-line', color: '#10a36b' },
  { key: 'totalI', label: '总电流', unit: 'A', d: 1, icon: 'ri-pulse-line', color: '#2a9d8f' },
  { key: 'maxCellV', label: '最大单体', unit: 'V', d: 3, icon: 'ri-arrow-up-circle-line', color: '#d97757' },
  { key: 'maxCellNo', label: '最大单体编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#d97757' },
  { key: 'minCellV', label: '最小单体', unit: 'V', d: 3, icon: 'ri-arrow-down-circle-line', color: '#2a9d8f' },
  { key: 'minCellNo', label: '最小单体编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#2a9d8f' },
  { key: 'maxT', label: '最大温度', unit: '℃', d: 1, icon: 'ri-temp-hot-line', color: '#d9a441' },
  { key: 'maxTNo', label: '最大温度编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#d9a441' },
  { key: 'minT', label: '最小温度', unit: '℃', d: 1, icon: 'ri-temp-cold-line', color: '#5f8fb8' },
  { key: 'minTNo', label: '最小温度编号', unit: '', d: 0, prefix: '#', icon: 'ri-hashtag', color: '#5f8fb8' }
];

export const DEFAULT_BMS_PINNED: BmsFieldMeta['key'][] = ['totalV', 'totalI', 'maxCellV', 'minCellV', 'maxT', 'minT'];
