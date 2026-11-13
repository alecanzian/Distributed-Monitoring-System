/** One metric value from one machine at one time (A3, A4). */
export interface Sample {
  machineId: string;
  site: string;
  metric: string;
  value: number;
  /** Epoch milliseconds. */
  ts: number;
}

export interface Point {
  ts: number;
  value: number;
}

export interface MachineState {
  machineId: string;
  site: string;
  status: "ok" | "down";
  lastSeen: number;
  latest: Record<string, number>;
}
