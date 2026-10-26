export interface MeterCfg {
  name: string;
  ip: string;
  port: number;
  slave: number;
  start: string;
  count: number;
}

export interface EssCfg {
  socMinWarn: number;
  socMinAlarm: number;
  socMaxWarn: number;
  socMaxAlarm: number;
  socHold: number;
  cellMinWarn: number;
  cellMinAlarm: number;
  cellMaxWarn: number;
  cellMaxAlarm: number;
  cellHold: number;
  deviceMaxKw: number;
  channelMaxKw: number;
  deviceMaxA: number;
  gridChgKw: number;
  gridDisKw: number;
}

export interface DeviceCfg {
  name: string;
  tcpIp: string;
  tcpPort: number;
  udpLocalIp: string;
  udpLocalPort: number;
  udpRemoteIp: string;
  udpRemotePort: number;
  channels: string;
}

export interface ParamCfg {
  vMax: number;
  vMin: number;
  iMax: number;
  iMin: number;
  pMax: number;
  pMin: number;
  tMax: number;
  tMin: number;
  cellMax: number;
  cellMin: number;
}

export interface BmsCfg {
  name: string;
  index: number;
  channelId: string;
  tcpIp: string;
  tcpPort: number;
  udpLocalIp: string;
  udpLocalPort: number;
  udpRemoteIp: string;
  udpRemotePort: number;
}

export interface ProtocolRow {
  no: number;
  canId: string;
  name: string;
  tag: string;
  bitType: string;
  start: number;
  length: number;
  resolution: number;
  offset: number;
  unit: string;
}

export interface WorkspaceCfg {
  id: string;
  channels: string;
  meters: MeterCfg[];
  ess: EssCfg;
  device: DeviceCfg;
  params: ParamCfg;
  bms: BmsCfg[];
  protocol: ProtocolRow[];
}

const PROTOCOL: ProtocolRow[] = [
  ['04038000', 'TmsCtrl_SetTemp', 31, 8, 1, 0],
  ['04038000', 'TmsCtrl_Mode', 23, 8, 1, 0],
  ['04038000', 'TmsCtrl_Inlet', 15, 8, 1, -40],
  ['04038000', 'TmsCtrl_Outlet', 7, 8, 1, -40],
  ['04500000', 'TCMS_HvOn', 11, 2, 1, 0],
  ['04500000', 'TCMS_HvOff', 9, 2, 1, 0],
  ['04500000', 'TCMS_Life', 7, 8, 1, 0],
  ['040F8000', 'TCMS_Cmd5', 5, 1, 1, 0],
  ['040F8000', 'TCMS_Cmd4', 4, 1, 1, 0],
  ['040F8000', 'TCMS_Cmd3', 3, 1, 1, 0],
  ['040F8000', 'TCMS_Cmd2', 2, 1, 1, 0],
  ['040F8000', 'TCMS_Cmd1', 1, 1, 1, 0],
  ['040F8000', 'TCMS_Cmd0', 0, 1, 1, 0],
  ['040F8000', 'TCMS_Time', 15, 32, 1, 0],
  ['04FF3F00', 'Life', 63, 8, 1, 0],
  ['04FF3F00', 'BMU_Current', 55, 8, 1, 0],
  ['04FF3F00', 'System_State', 47, 8, 1, 0],
  ['04FF3F00', 'System_Fault', 39, 8, 1, 0],
  ['04FF3F00', 'Cell_Volt', 31, 16, 0.001, 0, 'V'],
  ['04FF3F00', 'Cell_Temp', 15, 8, 1, -40, '℃']
].map((row, i) => {
  const [canId, name, start, length, resolution, offset, unit] = row as [string, string, number, number, number, number, string?];
  return {
    no: i + 1,
    canId,
    name,
    tag: 'Motorola',
    bitType: 'Motorola',
    start,
    length,
    resolution,
    offset,
    unit: unit ?? ''
  };
});

export const WORKSPACES: WorkspaceCfg[] = [
  {
    id: 'WorkSpace0',
    channels: '20, 21',
    meters: [
      { name: '储能系统', ip: '192.168.1.100', port: 8100, slave: 1, start: '0700', count: 92 },
      { name: '园区变压器', ip: '192.168.1.101', port: 8100, slave: 2, start: '0000', count: 64 },
      { name: '配电柜1', ip: '192.168.1.111', port: 8100, slave: 3, start: '0000', count: 48 },
      { name: '配电柜2', ip: '192.168.1.112', port: 8100, slave: 4, start: '0000', count: 48 },
      { name: '配电柜3', ip: '192.168.1.113', port: 8100, slave: 5, start: '0000', count: 48 }
    ],
    ess: {
      socMinWarn: 10, socMinAlarm: 5, socMaxWarn: 90, socMaxAlarm: 95, socHold: 30,
      cellMinWarn: 3.5, cellMinAlarm: 3, cellMaxWarn: 3.1, cellMaxAlarm: 3.6, cellHold: 3.3,
      deviceMaxKw: 600, channelMaxKw: 280, deviceMaxA: 300, gridChgKw: 10, gridDisKw: 100
    },
    device: {
      name: 'Charge1',
      tcpIp: '192.168.1.7', tcpPort: 5000,
      udpLocalIp: '192.168.1.202', udpLocalPort: 9000,
      udpRemoteIp: '192.168.1.7', udpRemotePort: 5000,
      channels: '["20","21"]'
    },
    params: {
      vMax: 2500, vMin: 0, iMax: 300, iMin: 0, pMax: 600, pMin: 0,
      tMax: 80, tMin: -80, cellMax: 4.25, cellMin: 3.15
    },
    bms: [
      {
        name: 'BMS0', index: 0, channelId: '20',
        tcpIp: '192.168.1.202', tcpPort: 5001,
        udpLocalIp: '192.168.1.202', udpLocalPort: 9001,
        udpRemoteIp: '192.168.1.7', udpRemotePort: 5001
      },
      {
        name: 'BMS1', index: 1, channelId: '21',
        tcpIp: '192.168.1.203', tcpPort: 5002,
        udpLocalIp: '192.168.1.203', udpLocalPort: 9002,
        udpRemoteIp: '192.168.1.7', udpRemotePort: 5002
      }
    ],
    protocol: PROTOCOL
  },
  {
    id: 'WorkSpace1',
    channels: '22, 23',
    meters: [
      { name: '储能系统', ip: '192.168.2.100', port: 8100, slave: 1, start: '0700', count: 92 },
      { name: '园区变压器', ip: '192.168.2.101', port: 8100, slave: 2, start: '0000', count: 64 },
      { name: '配电柜1', ip: '192.168.2.111', port: 8100, slave: 3, start: '0000', count: 48 },
      { name: '配电柜2', ip: '192.168.2.112', port: 8100, slave: 4, start: '0000', count: 48 }
    ],
    ess: {
      socMinWarn: 15, socMinAlarm: 8, socMaxWarn: 85, socMaxAlarm: 92, socHold: 40,
      cellMinWarn: 3.4, cellMinAlarm: 3.05, cellMaxWarn: 3.45, cellMaxAlarm: 3.65, cellHold: 3.28,
      deviceMaxKw: 500, channelMaxKw: 250, deviceMaxA: 260, gridChgKw: 20, gridDisKw: 80
    },
    device: {
      name: 'Charge2',
      tcpIp: '192.168.2.7', tcpPort: 5000,
      udpLocalIp: '192.168.2.202', udpLocalPort: 9000,
      udpRemoteIp: '192.168.2.7', udpRemotePort: 5000,
      channels: '["22","23"]'
    },
    params: {
      vMax: 2000, vMin: 0, iMax: 260, iMin: 0, pMax: 500, pMin: 0,
      tMax: 75, tMin: -40, cellMax: 4.2, cellMin: 3.1
    },
    bms: [
      {
        name: 'BMS0', index: 0, channelId: '22',
        tcpIp: '192.168.2.202', tcpPort: 5001,
        udpLocalIp: '192.168.2.202', udpLocalPort: 9001,
        udpRemoteIp: '192.168.2.7', udpRemotePort: 5001
      }
    ],
    protocol: PROTOCOL
  }
];
