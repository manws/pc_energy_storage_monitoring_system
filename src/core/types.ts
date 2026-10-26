export type MeterId = 'grid' | 'ess' | 'cab1' | 'cab2' | 'cab3';
export type PowerKey = MeterId | 'base';
export type CabId = 'cab1' | 'cab2' | 'cab3';
export type CabPhase = 'chg' | 'dis' | 'rest';
export type AlarmLevel = 'danger' | 'warning' | 'info' | 'success';
export type PhaseKey = 'a' | 'b' | 'c';

export interface MeterMeta {
  id: MeterId;
  name: string;
  short: string;
  color: string;
  icon: string;
  device: string;
}

export interface MeterReading {
  ua: number; ub: number; uc: number;
  uab: number; ubc: number; uca: number;
  ia: number; ib: number; ic: number;
  pa: number; pb: number; pc: number;
  ps: number;
}

export type HistoryPoint = [number, number];

export interface PcsChannel {
  no: number;
  time: string;
  voltage: number;
  current: number;
  power: number;
  chgAh: number;
  disAh: number;
  chgWh: number;
  disWh: number;
  step: string;
  status: '运行' | '待机' | '故障';
  mode: string;
  fault: string;
  pwmFault: string;
  dcdcFault: string;
}

export type PcsFieldKey = Exclude<keyof PcsChannel, 'no'>;

export interface BmsData {
  soc: number;
  totalV: number;
  totalI: number;
  maxCellV: number;
  maxCellNo: number;
  minCellV: number;
  minCellNo: number;
  maxT: number;
  maxTNo: number;
  minT: number;
  minTNo: number;
  tempBase: number;
  cells: number[];
  temps: number[];
}

export type BmsFieldKey = 'totalV' | 'totalI' | 'maxCellV' | 'maxCellNo' | 'minCellV' | 'minCellNo' | 'maxT' | 'maxTNo' | 'minT' | 'minTNo';

export interface BmsFieldMeta {
  key: BmsFieldKey;
  label: string;
  unit: string;
  d: number;
  prefix?: string;
  icon: string;
  color: string;
}

export interface PcsFieldMeta {
  key: PcsFieldKey;
  label: string;
  d?: number;
}

export interface AlarmItem {
  id: number;
  ts: number;
  level: AlarmLevel;
  source: string;
  msg: string;
}

export interface BackflowState {
  active: boolean;
  since: number;
  count: number;
  totalSec: number;
  peak: number;
  lastAt: number;
  acked: boolean;
}

export interface EnergyCounter {
  imp: number;
  exp: number;
}

export interface EnergyState {
  ts: number;
  power: Record<PowerKey, number>;
  meters: Record<MeterId, MeterReading>;
  history: Record<MeterId, HistoryPoint[]>;
  pcsHistory: [HistoryPoint[], HistoryPoint[]];
  socHistory: number[];
  pcs: [PcsChannel, PcsChannel];
  bms: BmsData;
  cabPhase: Record<CabId, CabPhase>;
  essLimited: boolean;
  essStep: number;
  energy: Record<MeterId, EnergyCounter>;
  backflow: BackflowState;
  alarms: AlarmItem[];
  alarmCountToday: number;
}
