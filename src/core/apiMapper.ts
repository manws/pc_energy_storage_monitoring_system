// 将后端接口原始响应映射为前端统一的 EnergyState。
// 设计原则：
// 1. 以接口真实数据为准；接口未提供的字段给出安全默认值（0 / 空数组 / 非激活）。
// 2. state.ts 取数据最新时间戳（而非当前时间），确保历史曲线落在可视窗口内。

import type {
  RawBigScreen, RawChannelData, RawCurrentEventData, RawDeviceData, RawMeterData, RawParamData
} from './api';
import type {
  AlarmItem, AlarmKind, AlarmLevel, BmsData, CabPhase, EnergyState, HistoryPoint, MeterId, MeterReading, PcsChannel
} from './types';
import type { BmsCfg, MeterCfg, ProtocolRow, WorkspaceCfg } from './workspaceConfig';
import { formatWorkspace } from './utils';

/** 把可能是字符串/空串的数值安全转为 number；空或非法返回 fallback。 */
export function num(v: unknown, fallback = 0): number {
  if (typeof v === 'number') return Number.isFinite(v) ? v : fallback;
  if (typeof v === 'string') {
    if (v.trim() === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

/** 解析后端时间字符串（"YYYY-MM-DD HH:mm:ss"）为毫秒时间戳；失败返回 0。 */
export function parseTime(s: string | null | undefined): number {
  if (!s) return 0;
  const t = Date.parse(s.replace(' ', 'T'));
  return Number.isFinite(t) ? t : 0;
}

export function emptyReading(): MeterReading {
  return { ua: 0, ub: 0, uc: 0, uab: 0, ubc: 0, uca: 0, ia: 0, ib: 0, ic: 0, pa: 0, pb: 0, pc: 0, ps: 0 };
}

function readingOf(m: RawBigScreen['bigScreen']['MeterCity'] | undefined): MeterReading {
  if (!m) return emptyReading();
  return {
    ua: num(m.Ua), ub: num(m.Ub), uc: num(m.Uc),
    uab: num(m.Uab), ubc: num(m.Ubc), uca: num(m.Uca),
    ia: num(m.Ia), ib: num(m.Ib), ic: num(m.Ic),
    pa: num(m.Pa), pb: num(m.Pb), pc: num(m.Pc),
    ps: num(m.Ps)
  };
}

type PowerDir = 'chg' | 'dis' | 'rest';

/**
 * 由工步名判定充放电方向。
 * 后端功率符号约定与前端不一致（实测：恒功率放电时 WorkKW 为正，而前端约定放电为负），
 * 因此统一以工步名为准，避免把放电显示成充电。
 */
function dirOf(step: string): PowerDir {
  if (!step) return 'rest';
  if (step.includes('放电')) return 'dis';
  if (step.includes('充电')) return 'chg';
  return 'rest';
}

/** 按方向统一功率符号：放电为负、充电为正（与前端既有约定一致）。 */
function signed(v: number, dir: PowerDir): number {
  if (dir === 'dis') return -Math.abs(v);
  if (dir === 'chg') return Math.abs(v);
  return v;
}

/** 文档枚举：优先 CurrentStateName，缺省按 nCurrentState 回退。 */
const CHANNEL_STATE: Record<number, string> = {
  0x00: '待机中',
  0x01: '启动过程中',
  0x02: '工作中',
  0x03: '停机过程中',
  0x04: '外部禁止运行',
  0xFF: '故障中'
};

function statusOf(raw: RawChannelData): string {
  const name = (raw.CurrentStateName || '').trim();
  if (name) return name;
  return CHANNEL_STATE[raw.nCurrentState] || '未知';
}

export interface ChannelIdentity {
  channelId: string;
  workspace: string;
}

function textId(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function kept(next: string | undefined, prev: string | undefined): string {
  if (next != null && next !== '') return next;
  return prev ?? '';
}

/** deviceData 才带工作单元和 ChannelId，大屏通道列表没有这两项。 */
export function channelIdentityOf(raw: RawDeviceData | null | undefined): ChannelIdentity[] {
  return (raw?.deviceList ?? []).map((d) => ({
    channelId: textId(d.ChannelId),
    workspace: textId(d.WorkSpaceName)
  }));
}

function channelOf(
  raw: RawChannelData,
  no: number,
  extra?: { channelId?: string; workspace?: string; bmsRaw?: Record<string, unknown> | null }
): PcsChannel {
  // 方向以工步名为准，功率符号按前端约定归一化（放电为负）。
  const power = signed(num(raw.WorkKW), dirOf(raw.StepName || ''));
  const dcErr = (raw.DCDCErr || '').trim();
  const mode = (raw.WorkModel || '').trim();
  return {
    no,
    channelId: extra?.channelId ?? '',
    workspace: extra?.workspace ?? '',
    time: raw.TimeValue || '--',
    voltage: num(raw.Vol),
    current: num(raw.Cur),
    power,
    chgAh: num(raw.ChargeAH),
    disAh: num(raw.DischargeAH),
    chgWh: num(raw.ChargeWH),
    disWh: num(raw.DischargeWH),
    step: raw.StepName || '--',
    status: statusOf(raw),
    mode,
    fault: '无',
    pwmFault: '无',
    dcdcFault: dcErr || '无',
    bmsRaw: extra?.bmsRaw ?? null
  };
}

export function emptyChannel(no: number): PcsChannel {
  return {
    no,
    channelId: '',
    workspace: '',
    time: '--',
    voltage: 0,
    current: 0,
    power: 0,
    chgAh: 0,
    disAh: 0,
    chgWh: 0,
    disWh: 0,
    step: '--',
    status: '待机中',
    mode: '',
    fault: '无',
    pwmFault: '无',
    dcdcFault: '无',
    bmsRaw: null
  };
}

function bmsOf(raw: RawDeviceData['deviceList'][number]['BMSData'] | undefined): BmsData {
  const b = raw;
  return {
    soc: num(b?.SOC),
    totalV: num(b?.Vol),
    totalI: num(b?.Cur),
    maxCellV: num(b?.MaxV),
    maxCellNo: num(b?.MaxVNo, 1) || 1,
    minCellV: num(b?.MinV),
    minCellNo: num(b?.MinVNo, 1) || 1,
    maxT: num(b?.MaxT),
    maxTNo: num(b?.MaxTNo, 1) || 1,
    minT: num(b?.MinT),
    minTNo: num(b?.MinTNo, 1) || 1,
    tempBase: num(b?.MinT),
    cells: [], // 接口未提供单体明细数组
    temps: []  // 接口未提供温度点明细数组
  };
}

/** 从一组功率点与时间轴构造 [ts, value][] 历史曲线。 */
function buildHistory(values: number[] | undefined, times: number[]): HistoryPoint[] {
  if (!values || !values.length) return [];
  const out: HistoryPoint[] = [];
  const n = values.length;
  // 时间轴长度不足时按 2s 间隔回推。
  const base = times.length ? times : [];
  const end = base.length ? base[base.length - 1] : Date.now();
  for (let i = 0; i < n; i++) {
    const ts = base.length === n ? base[i] : end - (n - 1 - i) * 5000;
    out.push([ts, Math.round(values[i] * 100) / 100]);
  }
  return out;
}

export interface RealtimeBundle {
  device?: RawDeviceData;
  meter?: RawMeterData;
  bigScreen?: RawBigScreen;
  current?: RawCurrentEventData;
}

/** 将 Param 接口响应映射为配置页使用的 WorkspaceCfg。 */
export function mapParamToWorkspace(raw: RawParamData, id: string): WorkspaceCfg {
  const p = raw.param;
  const dev = p.DeviceConfig;
  const dp = p.DeviceParamConfig;
  const cc = p.ControlConfigModel;

  const meters: MeterCfg[] = (p.MeterConfigList ?? []).map((m) => ({
    name: m.Name,
    ip: m.Ip,
    port: num(m.Port),
    slave: num(m.SlaveId),
    // StartAddr 为十进制寄存器地址，配置页按 4 位十六进制展示。
    start: num(m.StartAddr).toString(16).toUpperCase().padStart(4, '0'),
    count: num(m.RegisterCount)
  }));

  const bms: BmsCfg[] = (p.BMSConfigList ?? []).map((b) => ({
    name: b.Name,
    index: num(b.Index),
    channelId: b.ChannelId,
    tcpIp: b.Ip,
    tcpPort: num(b.Port),
    udpLocalIp: b.LocalIp,
    udpLocalPort: num(b.LocalPort),
    udpRemoteIp: b.RemoteIp,
    udpRemotePort: num(b.RemotePort)
  }));

  // BMS 协议：展开 signelProtocolList 为扁平表格行。
  const protocol: ProtocolRow[] = [];
  let no = 0;
  for (const grp of p.BMSProtocolList ?? []) {
    // CanId 为十进制，统一按 8 位十六进制展示（如 67338240 -> 04038000）。
    const canHex = num(grp.CanId).toString(16).toUpperCase().padStart(8, '0');
    const signals = (grp.signelProtocolList ?? []) as Array<Record<string, unknown>>;
    for (const s of signals) {
      no += 1;
      const bType = num(s.BType);
      const tag = bType === 0 ? 'Motorola' : 'Intel';
      protocol.push({
        no,
        canId: typeof s.CanId === 'number' ? num(s.CanId).toString(16).toUpperCase().padStart(8, '0') : canHex,
        name: String(s.Name ?? ''),
        tag,
        bitType: tag,
        start: num(s.StartBit),
        length: num(s.Length),
        resolution: num(s.Factor, 1),
        offset: num(s.Offset),
        unit: String(s.Unit ?? '')
      });
    }
  }

  return {
    id,
    channels: (dev?.ChannelIdList ?? []).join(', '),
    meters,
    bms,
    ess: {
      socMinWarn: num(cc?.SOC_Alarm_Min),
      socMinAlarm: num(cc?.SOC_Stop_Min),
      socMaxWarn: num(cc?.SOC_Alarm_Max),
      socMaxAlarm: num(cc?.SOC_Stop_Max),
      socHold: num(cc?.SOC_Std),
      cellMinWarn: num(cc?.CellVol_Alarm_Min),
      cellMinAlarm: num(cc?.CellVol_Stop_Min),
      cellMaxWarn: num(cc?.CellVol_Alarm_Max),
      cellMaxAlarm: num(cc?.CellVol_Stop_Max),
      cellHold: num(cc?.CellVol_Std),
      deviceMaxKw: num(cc?.Device_Power_Max),
      channelMaxKw: num(cc?.Device_Power_Channel_Max),
      deviceMaxA: num(cc?.Device_Cur_Max),
      gridChgKw: num(cc?.Power_Charge_Std),
      gridDisKw: num(cc?.Power_Discharge_Std)
    },
    device: {
      name: dev?.Name ?? '',
      tcpIp: dev?.Ip ?? '',
      tcpPort: num(dev?.Port),
      udpLocalIp: dev?.LocalIp ?? '',
      udpLocalPort: num(dev?.LocalPort),
      udpRemoteIp: dev?.RemoteIp ?? '',
      udpRemotePort: num(dev?.RemotePort),
      channels: JSON.stringify(dev?.ChannelIdList ?? [])
    },
    params: {
      vMax: num(dp?.VolMax), vMin: num(dp?.VolMin),
      iMax: num(dp?.CurMax), iMin: num(dp?.CurMin),
      pMax: num(dp?.PowerMax), pMin: num(dp?.PowerMin),
      tMax: num(dp?.TempMax), tMin: num(dp?.TempMin),
      cellMax: num(dp?.CellVolMax), cellMin: num(dp?.CellVolMin)
    },
    protocol
  };
}

function alarmLevelOf(msg: string, isAlarm: boolean): AlarmLevel {
  if (msg.includes('逆流') && !msg.includes('解除')) return 'danger';
  if (msg.includes('解除') || msg.includes('恢复') || msg.includes('正常') || msg.includes('通过')) return 'success';
  if (isAlarm) return 'warning';
  return 'info';
}

function kindOf(code: number, name?: string): AlarmKind {
  if (code === 1 || name === '告警' || name === '报警') return '告警';
  return '事件';
}

function mapEventList(list: RawBigScreen['bigScreen']['EventList'] | null | undefined): AlarmItem[] {
  const items = list ?? [];
  return [...items]
    .sort((a, b) => parseTime(b.eventTime) - parseTime(a.eventTime))
    .map((e, i) => {
      const kind = kindOf(e.eventTypeCode, e.eventTypeName);
      return {
        id: i + 1,
        ts: parseTime(e.eventTime),
        level: alarmLevelOf(e.eventMsg || '', kind === '告警'),
        kind,
        workspace: formatWorkspace(e.workSpaceName),
        source: e.channelId == null || String(e.channelId).trim() === '' ? '系统' : `通道${e.channelId}`,
        msg: e.eventMsg || e.eventName || ''
      };
    });
}

function keepBackflow(prev: EnergyState | undefined, active: boolean) {
  return {
    active,
    since: prev?.backflow.since ?? 0,
    count: prev?.backflow.count ?? 0,
    totalSec: prev?.backflow.totalSec ?? 0,
    peak: prev?.backflow.peak ?? 0,
    lastAt: prev?.backflow.lastAt ?? 0,
    acked: prev?.backflow.acked ?? false
  };
}

const phaseOf = (p: number): CabPhase => (p > 0.5 ? 'chg' : p < -0.5 ? 'dis' : 'rest');

/** 大屏实时量只消费 bigScreen。工作单元 / ChannelId 由调用方另附。 */
export function mapBigScreen(raw: RawBigScreen, prev?: EnergyState, identity?: ChannelIdentity[]): EnergyState {
  const bs = raw.bigScreen;
  const channels = bs.ChannelDataList ?? [];
  const latest = channels[0]?.TimeValue ? parseTime(channels[0].TimeValue) : 0;
  const ts = latest || Date.now();
  const pcs = channels.length
    ? channels.map((ch, i) => channelOf(ch, i + 1, {
      channelId: kept(identity?.[i]?.channelId, prev?.pcs[i]?.channelId),
      workspace: kept(identity?.[i]?.workspace, prev?.pcs[i]?.workspace)
    }))
    : [emptyChannel(1), emptyChannel(2)];
  const essDir = dirOf(channels[0]?.StepName || '');
  const essP = pcs.reduce((sum, ch) => sum + ch.power, 0);
  const power = {
    base: 0,
    grid: num(bs.PsCity),
    ess: signed(num(bs.PsDevice) || essP, essDir),
    cab1: num(bs.MeterCabinet1?.Ps),
    cab2: num(bs.MeterCabinet2?.Ps),
    cab3: num(bs.MeterCabinet3?.Ps)
  };
  return {
    ts,
    power,
    meters: {
      grid: readingOf(bs.MeterCity),
      ess: readingOf(bs.MeterEg),
      cab1: readingOf(bs.MeterCabinet1),
      cab2: readingOf(bs.MeterCabinet2),
      cab3: readingOf(bs.MeterCabinet3)
    },
    history: prev?.history ?? { grid: [], ess: [], cab1: [], cab2: [], cab3: [] },
    pcsHistory: prev?.pcsHistory ?? [[], []],
    socHistory: (bs.SOCList ?? []).map((v) => num(v)),
    pcs,
    bms: prev?.bms ?? bmsOf(undefined),
    cabPhase: { cab1: phaseOf(power.cab1), cab2: phaseOf(power.cab2), cab3: phaseOf(power.cab3) },
    essLimited: false,
    essStep: num(channels[0]?.nStepCode, 1),
    energy: {
      grid: { imp: 0, exp: 0 },
      ess: { imp: 0, exp: num(bs.SavePower) },
      cab1: { imp: 0, exp: 0 },
      cab2: { imp: 0, exp: 0 },
      cab3: { imp: 0, exp: 0 }
    },
    backflow: keepBackflow(prev, power.grid < 0),
    alarms: mapEventList(bs.EventList),
    alarmCountToday: num(bs.AlarmCount)
  };
}

function lastOf(list: number[] | undefined, fallback = 0): number {
  if (!list?.length) return fallback;
  return num(list[list.length - 1], fallback);
}

/** 电表页：只消费 meterData。曲线无时间轴，按 5s 回推（与设备 TimeList 间隔一致）。 */
export function mapMeter(raw: RawMeterData, prev?: EnergyState): EnergyState {
  const m = raw.meter;
  const times: number[] = [];
  const base = prev ?? mapBigScreen({ bigScreen: {} as RawBigScreen['bigScreen'] });
  const history: Record<MeterId, HistoryPoint[]> = {
    grid: buildHistory(m?.PsCityList, times),
    ess: buildHistory(m?.PsDeviceList, times),
    cab1: buildHistory(m?.PsCabinet1List, times),
    cab2: buildHistory(m?.PsCabinet2List, times),
    cab3: buildHistory(m?.PsCabinet3List, times)
  };
  const ps = {
    grid: lastOf(m?.PsCityList, num(m?.PsCity)),
    ess: lastOf(m?.PsDeviceList, num(m?.PsDevice)),
    cab1: lastOf(m?.PsCabinet1List, num(m?.PsCabinet1)),
    cab2: lastOf(m?.PsCabinet2List, num(m?.PsCabinet2)),
    cab3: lastOf(m?.PsCabinet3List, num(m?.PsCabinet3))
  };
  const meters = { ...base.meters };
  (Object.keys(ps) as MeterId[]).forEach((id) => {
    meters[id] = { ...meters[id], ps: ps[id] };
  });
  const ts = history.grid.length ? history.grid[history.grid.length - 1][0] : Date.now();
  return {
    ...base,
    ts,
    meters,
    history,
    power: { ...base.power, ...ps },
    backflow: keepBackflow(prev, ps.grid < 0)
  };
}

/** 储能监控：只消费 deviceData。 */
export function mapDevice(raw: RawDeviceData, prev?: EnergyState): EnergyState {
  const devices = raw.deviceList ?? [];
  const times = (devices[0]?.TimeList ?? []).map(parseTime).filter((t) => t > 0);
  const latest = devices[0]?.ChannelData?.TimeValue
    ? parseTime(devices[0].ChannelData.TimeValue)
    : (times.length ? times[times.length - 1] : Date.now());
  const pcs = devices.length
    ? devices.map((d, i) => channelOf(d.ChannelData, (d.Index ?? i) + 1, {
      channelId: d.ChannelId || '',
      workspace: d.WorkSpaceName || '',
      bmsRaw: d.BMSData ? { ...d.BMSData } : null
    }))
    : [emptyChannel(1), emptyChannel(2)];
  const pcsHistory = devices.map((d) => buildHistory(d.PowerList, times));
  const base = prev ?? mapBigScreen({ bigScreen: {} as RawBigScreen['bigScreen'] });
  return {
    ...base,
    ts: latest || Date.now(),
    pcs,
    pcsHistory,
    bms: bmsOf(devices[0]?.BMSData)
  };
}

/** 兼容旧入口：按已提供的接口拼装。 */
export function mapToEnergyState(b: RealtimeBundle, prev?: EnergyState): EnergyState {
  if (b.bigScreen) return mapBigScreen(b.bigScreen, prev);
  if (b.meter) return mapMeter(b.meter, prev);
  if (b.device) return mapDevice(b.device, prev);
  return prev ?? mapBigScreen({ bigScreen: {} as RawBigScreen['bigScreen'] });
}
