// 将后端接口原始响应映射为前端统一的 EnergyState。
// 设计原则：
// 1. 以接口真实数据为准；接口未提供的字段给出安全默认值（0 / 空数组 / 非激活），
//    依赖前端各组件已有的降级逻辑（cells 为空则隐藏 BMS 栏 / 显示整包等）。
// 2. state.ts 取数据最新时间戳（而非当前时间），确保历史曲线落在可视窗口内。

import type {
  RawBigScreen, RawChannelData, RawCurrentEventData, RawDeviceData, RawMeterData, RawParamData
} from './api';
import type {
  AlarmItem, AlarmLevel, BmsData, CabPhase, EnergyState, HistoryPoint, MeterId, MeterReading, PcsChannel
} from './types';
import type { BmsCfg, MeterCfg, ProtocolRow, WorkspaceCfg } from './workspaceConfig';

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

function emptyReading(): MeterReading {
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

function statusOf(raw: RawChannelData): PcsChannel['status'] {
  const n = raw.nCurrentState;
  const name = raw.CurrentStateName || '';
  if (n === 2 || name.includes('工作')) return '运行';
  if (name.includes('故障') || (raw.DCDCErr && raw.DCDCErr.trim() !== '')) return '故障';
  return '待机';
}

function channelOf(raw: RawChannelData, no: number): PcsChannel {
  const power = num(raw.WorkKW);
  const dcErr = (raw.DCDCErr || '').trim();
  return {
    no,
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
    mode: raw.WorkModel || raw.StepName || '--',
    fault: '无',
    pwmFault: '无',
    dcdcFault: dcErr || '无'
  };
}

function emptyChannel(no: number): PcsChannel {
  return {
    no, time: '--', voltage: 0, current: 0, power: 0,
    chgAh: 0, disAh: 0, chgWh: 0, disWh: 0,
    step: '--', status: '待机', mode: '--', fault: '无', pwmFault: '无', dcdcFault: '无'
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
    const ts = base.length === n ? base[i] : end - (n - 1 - i) * 2000;
    out.push([ts, Math.round(values[i] * 100) / 100]);
  }
  return out;
}

export interface RealtimeBundle {
  device: RawDeviceData;
  meter: RawMeterData;
  bigScreen: RawBigScreen;
  current: RawCurrentEventData;
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
    const canHex = `04${num(grp.CanId).toString(16).toUpperCase().padStart(6, '0').slice(-6)}`;
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

function alarmLevelOf(e: RawCurrentEventData['eventList'][number]): AlarmLevel {
  const msg = e.EventMsg || '';
  if (msg.includes('逆流') && !msg.includes('解除')) return 'danger';
  if (msg.includes('解除') || msg.includes('恢复') || msg.includes('正常') || msg.includes('通过')) return 'success';
  if (e.EventType === 1) return 'warning';
  return 'info';
}

function mapAlarms(current: RawCurrentEventData): { alarms: AlarmItem[] } {
  const list = current.eventList ?? [];
  // 事件时间倒序（最新在前），与前端告警栏期望一致。
  const sorted = [...list].sort((a, b) => parseTime(b.EventTime) - parseTime(a.EventTime));
  const alarms: AlarmItem[] = sorted.map((e, i) => ({
    id: i + 1,
    ts: parseTime(e.EventTime),
    level: alarmLevelOf(e),
    source: e.ChannelId ? `通道${e.ChannelId}` : '系统',
    msg: e.EventMsg || ''
  }));
  return { alarms };
}

/** 主映射：接口数据 → EnergyState */
export function mapToEnergyState(b: RealtimeBundle, prev?: EnergyState): EnergyState {
  const bs = b.bigScreen.bigScreen;
  const devices = b.device.deviceList ?? [];
  const times = (devices[0]?.TimeList ?? []).map(parseTime).filter((t) => t > 0);

  // 以数据最新时间戳为基准（无则退回当前时间）
  const latest = devices[0]?.ChannelData?.TimeValue
    ? parseTime(devices[0].ChannelData.TimeValue)
    : (times.length ? times[times.length - 1] : Date.now());
  const ts = latest || Date.now();

  // 电表瞬时读数（大屏对象）
  const meters: Record<MeterId, MeterReading> = {
    grid: readingOf(bs.MeterCity),
    ess: readingOf(bs.MeterEg),
    cab1: readingOf(bs.MeterCabinet1),
    cab2: readingOf(bs.MeterCabinet2),
    cab3: readingOf(bs.MeterCabinet3)
  };

  // 历史功率曲线（电表接口 720 点）
  const m = b.meter.meter;
  const history: Record<MeterId, HistoryPoint[]> = {
    grid: buildHistory(m?.PsCityList, times),
    ess: buildHistory(m?.PsDeviceList, times),
    cab1: buildHistory(m?.PsCabinet1List, times),
    cab2: buildHistory(m?.PsCabinet2List, times),
    cab3: buildHistory(m?.PsCabinet3List, times)
  };

  // PCS 通道（优先设备接口，缺省回退大屏 ChannelDataList）
  const chSource: RawChannelData[] = devices.length
    ? devices.map((d) => d.ChannelData)
    : (bs.ChannelDataList ?? []);
  const pcs: [PcsChannel, PcsChannel] = [
    chSource[0] ? channelOf(chSource[0], 1) : emptyChannel(1),
    chSource[1] ? channelOf(chSource[1], 2) : emptyChannel(2)
  ];

  // PCS 功率历史（设备接口 PowerList）
  const pcsHistory: [HistoryPoint[], HistoryPoint[]] = [
    buildHistory(devices[0]?.PowerList, times),
    buildHistory(devices[1]?.PowerList, times)
  ];

  // BMS（接口字段多为空，cells/temps 不提供）
  const bms = bmsOf(devices[0]?.BMSData);

  // 功率总览
  const essP = pcs[0].power + pcs[1].power;
  const power = {
    base: 0,
    grid: num(bs.PsCity),
    ess: num(bs.PsDevice) || essP,
    cab1: num(bs.MeterCabinet1?.Ps),
    cab2: num(bs.MeterCabinet2?.Ps),
    cab3: num(bs.MeterCabinet3?.Ps)
  };

  // 配电柜工况（由功率正负推断）
  const phase = (p: number): CabPhase => (p > 0.5 ? 'chg' : p < -0.5 ? 'dis' : 'rest');

  const { alarms } = mapAlarms(b.current);

  return {
    ts,
    power,
    meters,
    history,
    pcsHistory,
    socHistory: (bs.SOCList ?? []).map((v) => num(v)),
    pcs,
    bms,
    cabPhase: { cab1: phase(power.cab1), cab2: phase(power.cab2), cab3: phase(power.cab3) },
    essLimited: false,
    essStep: num(devices[0]?.ChannelData?.nStepCode, 1) || 1,
    energy: {
      // 接口仅提供“节省电量”总量，映射到储能放电计量；其余无对应，置 0
      grid: { imp: 0, exp: 0 },
      ess: { imp: 0, exp: num(bs.SavePower) },
      cab1: { imp: 0, exp: 0 },
      cab2: { imp: 0, exp: 0 },
      cab3: { imp: 0, exp: 0 }
    },
    backflow: {
      active: power.grid < 0,
      since: prev?.backflow.since ?? 0,
      count: prev?.backflow.count ?? 0,
      totalSec: prev?.backflow.totalSec ?? 0,
      peak: prev?.backflow.peak ?? 0,
      lastAt: prev?.backflow.lastAt ?? 0,
      acked: prev?.backflow.acked ?? false
    },
    alarms,
    alarmCountToday: num(bs.AlarmCount)
  };
}
