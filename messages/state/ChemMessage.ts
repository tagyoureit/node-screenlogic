import { Inbound, SLData } from '../SLMessage';


export class ChemMessage {
  public static decodeChemDataMessage(msg: Inbound) {
    let isValid = false;

    const sentinel = msg.readInt32LE();
    if (sentinel === 42) {
      isValid = true;
      // msg._smartBuffer.readOffset++;
      msg.incrementReadOffset(1);
      const pH = msg.readUInt16BE() / 100;
      const orp = msg.readUInt16BE();
      const pHSetPoint = msg.readUInt16BE() / 100;
      const orpSetPoint = msg.readUInt16BE();
      // msg._smartBuffer.readOffset += 12;
      msg.incrementReadOffset(12);
      const pHTankLevel = msg.readUInt8();
      const orpTankLevel = msg.readUInt8();
      let saturation = msg.readUInt8();
      if ((saturation & 128) !== 0) {
        saturation = -(256 - saturation);
      }
      saturation /= 100;
      const calcium = msg.readUInt16BE();
      const cyanuricAcid = msg.readUInt16BE();
      const alkalinity = msg.readUInt16BE();
      const salt = msg.readUInt16LE();
      const saltPPM = salt * 50;
      const temperature = msg.readUInt8();
      msg.incrementReadOffset(2);
      const balance = msg.readUInt8();
      const corrosive = (balance & 1) !== 0;
      const scaling = (balance & 2) !== 0;
      const error = (salt & 128) !== 0;
      const data: SLChemData = {
        senderId: msg.senderId,
        isValid,
        pH,
        orp,
        pHSetPoint,
        orpSetPoint,
        pHTankLevel,
        orpTankLevel,
        saturation,
        calcium,
        cyanuricAcid,
        alkalinity,
        saltPPM,
        temperature,
        balance,
        corrosive,
        scaling,
        error
      };
      return data;
    }
  }
  public static decodecChemHistoryMessage(msg: Inbound) {
    const readTimePHPointsPairs = () => {
      const retval:TimePHPointsPairs[] = [];
      // 4 bytes for the length
      if (msg.length >= msg.readOffset + 4) {
        const points = msg.readInt32LE();
        // 16 bytes per time, 4 bytes per pH reading
        if (msg.length >= msg.readOffset + (points * (16 + 4))) {
          for (let i = 0; i < points; i++) {
            const time = msg.readSLDateTime();
            const pH = msg.readInt32LE() / 100;
            retval.push({
              time: time,
              pH: pH,
            });
          }
        }
      }

      return retval;
    };

    const readTimeORPPointsPairs = () => {
      const retval: TimeORPPointsPairs[] = [];
      // 4 bytes for the length
      if (msg.length >= msg.readOffset + 4) {
        const points = msg.readInt32LE();
        // 16 bytes per time, 4 bytes per ORP reading
        if (msg.length >= msg.readOffset + (points * (16 + 4))) {
          for (let i = 0; i < points; i++) {
            const time = msg.readSLDateTime();
            const orp = msg.readInt32LE();
            retval.push({
              time: time,
              orp: orp,
            });
          }
        }
      }

      return retval;
    };

    const readTimeTimePointsPairs = () => {
      const retval:TimeTimePointsPairs[] = [];
      // 4 bytes for the length
      if (msg.length >= msg.readOffset + 4) {
        const points = msg.readInt32LE();
        // 16 bytes per on time, 16 bytes per off time
        if (msg.length >= msg.readOffset + (points * (16 + 16))) {
          for (let i = 0; i < points; i++) {
            const onTime = msg.readSLDateTime();
            const offTime = msg.readSLDateTime();
            retval.push({
              on: onTime,
              off: offTime,
            });
          }
        }
      }

      return retval;
    };
    const data: SLChemHistory = {
      phPoints: readTimePHPointsPairs(),
      orpPoints: readTimeORPPointsPairs(),
      phRuns: readTimeTimePointsPairs(),
      orpRuns: readTimeTimePointsPairs()
    };
    return data;
  }
}

export interface SLChemData extends SLData {
  isValid: boolean;
  pH: number;
  orp: number;
  pHSetPoint: number;
  orpSetPoint: number;
  pHTankLevel: number;
  orpTankLevel: number;
  saturation: number;
  calcium: number;
  cyanuricAcid: number;
  alkalinity: number;
  saltPPM: number;
  temperature: number;
  balance: number;
  corrosive: boolean;
  scaling: boolean;
  error: boolean;
}

export interface TimePHPointsPairs {
  time: Date;
  pH: number;
}
export interface TimeORPPointsPairs {
  time: Date;
  orp: number;
}
export interface TimeTimePointsPairs {
  on: Date;
  off: Date;
}
export interface SLChemHistory {
  phPoints: TimePHPointsPairs[];
  orpPoints: TimeORPPointsPairs[];
  phRuns: TimeTimePointsPairs[];
  orpRuns: TimeTimePointsPairs[];
}
