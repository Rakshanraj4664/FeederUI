import {
  readRegister,
  writeRegister,
  readCoil,
  writeCoil,
  getConnectionStatus
} from '../api'

export interface PlcWidthState {
  connected: boolean
  gap: number
  offset: number
}

export async function getPlcWidth(): Promise<PlcWidthState> {
  const connected = await getConnectionStatus()
  if (!connected) return { connected: false, gap: 0, offset: 0 }

  try {
    const gap = await readRegister(2000)
    const offset = await readRegister(2004)
    return { connected: true, gap, offset }
  } catch {
    return { connected: false, gap: 0, offset: 0 }
  }
}

export async function writePlcRegister(
  address: number,
  value: number
): Promise<boolean> {
  return writeRegister(address, value)
}

export async function readPlcRegister(
  address: number
): Promise<number> {
  return readRegister(address)
}

export async function setPlcCoil(
  address: number,
  state: boolean
): Promise<boolean> {
  return writeCoil(address, state)
}

export async function getPlcCoil(
  address: number
): Promise<boolean> {
  return readCoil(address)
}
