// 储能监控系统 · 后端接口封装
// 服务端：YT.EMSWebViewApiServer（Swagger: /swagger/v1/swagger.json）
// 所有接口均为 POST + application/json。
// 开发环境经由 vite proxy 将 /api 转发到 http://8.140.182.55:26029。
// 生产环境可通过 VITE_API_BASE 指定后端地址（留空则走同源 /api，需部署侧反代）。

const BASE = (import.meta.env.VITE_API_BASE as string | undefined) ?? '';

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  result: T | null;
}

export class ApiError extends Error {
  code: number;
  constructor(code: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
  }
}

/** 统一 POST 请求。返回 result 负载；非 200 业务码抛 ApiError。 */
export async function apiPost<T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
    signal
  });
  if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status}`);
  const text = await res.text();
  // 个别接口（如 workSpaceNameList）直接返回数组，而非统一信封。
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new ApiError(-1, '响应解析失败');
  }
  if (data && typeof data === 'object' && 'code' in data) {
    const env = data as ApiEnvelope<T>;
    if (env.code !== 200) throw new ApiError(env.code, env.message || `业务错误 ${env.code}`);
    return env.result as T;
  }
  return data as T;
}

// ========================= 原始响应类型 =========================

export interface RawMeter {
  Index: number;
  Name: string;
  TimeValue: string;
  Ua: number; Ub: number; Uc: number;
  Uab: number; Ubc: number; Uca: number;
  Ia: number; Ib: number; Ic: number;
  Pa: number; Pb: number; Pc: number; Ps: number;
  Qa: number; Qb: number; Qc: number; Qs: number;
  PFa: number; PFb: number; PFc: number; PFs: number;
  Sa: number; Sb: number; Sc: number; Ss: number;
  F: number;
  [k: string]: number | string;
}

export interface RawChannelData {
  TimeValue: string;
  Vol: string;
  Cur: string;
  ChargeAH: string;
  DischargeAH: string;
  WorkKW: string;
  ChargeWH: string;
  DischargeWH: string;
  nStepCode: number;
  StepName: string;
  nCurrentState: number;
  CurrentStateName: string;
  PWM_KW: string | null;
  nWorkModel: number;
  WorkModel: string | null;
  DCDCErr: string;
}

export interface RawBmsData {
  DataDict: Record<string, string>;
  TimeValue: string;
  Index: number;
  Vol: string;
  Cur: string;
  MaxV: string; MinV: string;
  MaxVNo: string; MinVNo: string;
  MaxT: string; MinT: string;
  MaxTNo: string; MinTNo: string;
  SOC: string;
}

export interface RawDeviceItem {
  Index: number;
  WorkSpaceName: string;
  ChannelId: string;
  ChannelData: RawChannelData;
  BMSData: RawBmsData;
  TimeList: string[];
  PowerList: number[];
}

export interface RawDeviceData {
  deviceList: RawDeviceItem[];
}

export interface RawMeterData {
  meter: {
    PsCity: number; PsDevice: number;
    PsCabinet1: number; PsCabinet2: number; PsCabinet3: number;
    PsCityList: number[]; PsDeviceList: number[];
    PsCabinet1List: number[]; PsCabinet2List: number[]; PsCabinet3List: number[];
  };
}

export interface RawBigScreen {
  bigScreen: {
    EventList: RawEventPageItem[];
    MeterCity: RawMeter; MeterEg: RawMeter;
    MeterCabinet1: RawMeter; MeterCabinet2: RawMeter; MeterCabinet3: RawMeter;
    PsCity: number; PsDevice: number; PsCabinetAll: number;
    CellVolMax: number; CellVolMin: number;
    SavePower: number; AlarmCount: number; PsCityZeroCount: number;
    ChannelDataList: RawChannelData[];
    SOCList: number[];
  };
}

export interface RawCurrentEvent {
  WorkSpaceName: string;
  ChannelId: string;
  EventCode: number;
  EventType: number;
  EventMsg: string;
  EventTime: string;
}

export interface RawCurrentEventData {
  eventList: RawCurrentEvent[];
}

export interface RawEventPageItem {
  id: number;
  workSpaceName: string;
  channelId: string;
  eventTypeCode: number;
  eventTypeName: string;
  eventCode: number;
  eventName: string;
  eventMsg: string;
  eventTime: string;
}

export interface RawPage {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
}

export interface RawEventPageData {
  eventList: RawEventPageItem[] | null;
  page: RawPage;
}

export interface RawUser {
  id: number;
  usergroupId: number;
  userCode: string;
  userName: string;
  userPwd: string;
  phone: string;
  email: string;
  enabled: number;
  updateBy?: string;
  updateOn?: string;
}

export interface RawUserPageData {
  userList: RawUser[] | null;
  page: RawPage;
}

export interface RawMeterConfig {
  Name: string; Index: number; Ip: string; Port: number;
  SlaveId: number; StartAddr: number; RegisterCount: number;
}

export interface RawBmsConfig {
  Name: string; Index: number; ChannelId: string;
  Ip: string; Port: number;
  LocalIp: string; LocalPort: number;
  RemoteIp: string; RemotePort: number;
}

export interface RawDeviceConfig {
  Name: string; Ip: string; Port: number;
  LocalIp: string; LocalPort: number;
  RemoteIp: string; RemotePort: number;
  ChannelIdList: string[];
}

export interface RawDeviceParamConfig {
  VolMax: number; VolMin: number;
  CurMax: number; CurMin: number;
  PowerMax: number; PowerMin: number;
  TempMax: number; TempMin: number;
  CellVolMax: number; CellVolMin: number;
}

export interface RawControlConfig {
  CellVol_Stop_Max: number; CellVol_Alarm_Min: number;
  CellVol_Alarm_Max: number; CellVol_Stop_Min: number; CellVol_Std: number;
  SOC_Alarm_Min: number; SOC_Alarm_Max: number;
  SOC_Stop_Min: number; SOC_Stop_Max: number; SOC_Std: number;
  Device_Power_Max: number; Device_Power_Channel_Max: number; Device_Cur_Max: number;
  Power_Discharge_Std: number; Power_Charge_Std: number;
}

export interface RawBmsProtocolSignal {
  no?: number;
  Name?: string;
  name?: string;
  [k: string]: unknown;
}

export interface RawBmsProtocol {
  CanId: string;
  enabled: number;
  signelProtocolList: RawBmsProtocolSignal[] | null;
}

export interface RawParamData {
  param: {
    MeterConfigList: RawMeterConfig[];
    BMSConfigList: RawBmsConfig[];
    DeviceConfig: RawDeviceConfig;
    DeviceParamConfig: RawDeviceParamConfig;
    ControlConfigModel: RawControlConfig;
    BMSProtocolList: RawBmsProtocol[];
    WorkSpaceName: string;
  };
}

// ========================= 接口方法 =========================

export const EmsApi = {
  workSpaceNameList: (signal?: AbortSignal) =>
    apiPost<string[]>('/api/v1/WorkSpace/workSpaceNameList', {}, signal),

  bigScreen: (signal?: AbortSignal) =>
    apiPost<RawBigScreen>('/api/v1/BigScreen/bigScreen', {}, signal),

  deviceData: (signal?: AbortSignal) =>
    apiPost<RawDeviceData>('/api/v1/Device/deviceData', {}, signal),

  meterData: (signal?: AbortSignal) =>
    apiPost<RawMeterData>('/api/v1/Meter/meterData', {}, signal),

  currentEvent: (signal?: AbortSignal) =>
    apiPost<RawCurrentEventData>('/api/v1/Event/current', {}, signal),

  eventPage: (body: { eventType?: number; eventDate?: string; pageIndex: number; pageSize: number }, signal?: AbortSignal) =>
    apiPost<RawEventPageData>('/api/v1/Event/pageList', body, signal),

  paramData: (workSpaceName: string, signal?: AbortSignal) =>
    apiPost<RawParamData>(`/api/v1/Param/paramData/${encodeURIComponent(workSpaceName)}`, {}, signal),

  userPage: (body: { userCode?: string; userName?: string; pageIndex: number; pageSize: number }, signal?: AbortSignal) =>
    apiPost<RawUserPageData>('/api/v1/User/pageList', body, signal),

  userSingle: (userId: number, signal?: AbortSignal) =>
    apiPost<{ userInfo: RawUser }>(`/api/v1/User/single/${userId}`, {}, signal),

  userInsert: (body: Partial<RawUser>, signal?: AbortSignal) =>
    apiPost<null>('/api/v1/User/insert', body, signal),

  userUpdate: (userId: number, body: Partial<RawUser> & { userId?: number }, signal?: AbortSignal) =>
    apiPost<null>(`/api/v1/User/update/${userId}`, body, signal)
};
