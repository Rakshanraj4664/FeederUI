const API_BASE = "http://192.168.1.100:3000/api";

export interface AxisState {
  speed: number;
  enabled: boolean;
  width?: number;
}

export interface SystemStatus {
  connected: boolean;
  axes: Record<number, AxisState>;
  registers?: Partial<RegisterMap>;
}

export interface RegisterMap {
  // Target speed registers (master control) - Read only from PLC calc
  D28022: number; // MC1 target speed
  D28024: number; // MC2 target speed
  D28026: number; // MC3 target speed
  D28028: number; // MC4 target speed

  // User modifier registers (writable - speed multipliers)
  D20002: number; // mc1_low - Axis 1 speed multiplier
  D20004: number; // mc1_high - Axis 1 position/advanced modifier
  D20008: number; // mc2_low - Axis 2 speed multiplier
  D20010: number; // mc2_high - Axis 2 position/advanced modifier
  D20012: number; // mc2_man - Axis 2 manual mode modifier
  D20014: number; // mc3_low - Axis 3 speed multiplier
  D20016: number; // mc3_high - Axis 3 position/advanced modifier
  D20018: number; // mc3_man - Axis 3 manual mode modifier
  D20020: number; // mc4_low - Axis 4 speed multiplier
  D20022: number; // mc4_high - Axis 4 position/advanced modifier
  D20024: number; // mc4_man - Axis 4 manual mode modifier

  // Stepper control registers
  D2000: number;  // Stepper 1 frequency low
  D2001: number;  // Stepper 1 frequency high
  D2004: number;  // Stepper 2 frequency low
  D2005: number;  // Stepper 2 frequency high

  // Modbus communication
  D20026: number; // Data source for Modbus write
}

// Input status mapping (read only)
export interface InputStatus {
  X0_1: boolean;  // Auto mode (Axis 1)
  X0_2: boolean;  // Auto mode (Axis 2) / Manual ANALOG0
  X0_3: boolean;  // Auto mode (Axis 3) / Stepper pushbutton
  X0_4: boolean;  // Auto mode (Axis 4) / Stepper pushbutton
  X0_5: boolean;  // Stepper pushbutton
  X0_6: boolean;  // Stepper pushbutton
  X0_10: boolean; // Sensor/Enable (Axis 1) / Sensor ANALOG0
  X0_11: boolean; // Auto signal ANALOG0
  X0_12: boolean; // Sensor ANALOG1 / Auto Axis 2
  X0_13: boolean; // Auto signal ANALOG1
  X0_14: boolean; // Sensor ANALOG2 / Auto Axis 3
  X0_15: boolean; // Auto signal ANALOG2
  X0_16: boolean; // Sensor ANALOG3 / Auto Axis 4
  X0_17: boolean; // Auto signal ANALOG3
}

export async function fetchStatus(): Promise<SystemStatus> {
  try {
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    return { connected: false, axes: {} };
  }
}

export async function getConnectionStatus(): Promise<boolean> {
  try {
    const status = await fetchStatus();
    return status.connected;
  } catch {
    return false;
  }
}

export async function setSpeed(axis: number, speed: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/speed/${axis}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setWidth(width: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/width/1`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ width }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setEnabled(axis: number, enabled: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/enable/${axis}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function emergencyStop(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/emergency-stop`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function setAllSpeeds(speed: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/speed/all`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ speed }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function readRegister(address: number): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/register/${address}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.value ?? 0;
  } catch {
    return 0;
  }
}

export async function writeRegister(address: number, value: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/register/${address}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function readCoil(address: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/coil/${address}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.state ?? false;
  } catch {
    return false;
  }
}

export async function writeCoil(address: number, state: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/coil/${address}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function readInput(address: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/input/${address}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.state ?? false;
  } catch {
    return false;
  }
}

export async function setModifier(axis: number, value: number): Promise<boolean> {
  const addresses: Record<number, number> = {
    1: 20002,
    2: 20008,
    3: 20014,
    4: 20020,
  };
  const addr = addresses[axis];
  if (!addr) return false;
  return writeRegister(addr, value);
}

export async function readModifier(axis: number): Promise<number> {
  const addresses: Record<number, number> = {
    1: 20002,
    2: 20008,
    3: 20014,
    4: 20020,
  };
  const addr = addresses[axis];
  if (!addr) return 0;
  return readRegister(addr);
}

export async function stepperMove(
  motor: 1 | 2,
  frequency: number,
  direction: 'forward' | 'reverse'
): Promise<boolean> {
  const freqReg = motor === 1 ? 2000 : 2004
  const dirCoil = motor === 1
    ? (direction === 'forward' ? 0 : 1)
    : (direction === 'forward' ? 2 : 3)

  await writeRegister(freqReg, frequency)
  await writeRegister(freqReg + 1, 0)
  return writeCoil(dirCoil, true)
}
