import React, { useMemo } from 'react';

export interface ClientQrCodeProps {
  value: string;
  size?: number;
  className?: string;
  level?: 'L' | 'M' | 'Q' | 'H';
  margin?: number;
  bgColor?: string;
  fgColor?: string;
}

const QRMode = { BYTE: 4 };
const QRErrorCorrectionLevel = { L: 1, M: 0, Q: 3, H: 2 };

// GF(256) tables for QR polynomial math
const EXP_TABLE = new Array(512);
const LOG_TABLE = new Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP_TABLE[i] = x;
  EXP_TABLE[i + 255] = x;
  LOG_TABLE[x] = i;
  x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
}

function glog(n: number) {
  if (n < 1) throw new Error('glog(' + n + ')');
  return LOG_TABLE[n];
}
function gexp(n: number) {
  let v = n;
  while (v < 0) v += 255;
  while (v >= 256) v -= 255;
  return EXP_TABLE[v];
}

class QRPolynomial {
  num: number[];
  constructor(num: number[], shift = 0) {
    let offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (let i = 0; i < num.length - offset; i++) this.num[i] = num[offset + i];
    for (let i = num.length - offset; i < this.num.length; i++) this.num[i] = 0;
  }
  get(index: number) { return this.num[index]; }
  getLength() { return this.num.length; }
  multiply(e: QRPolynomial): QRPolynomial {
    const num = new Array(this.getLength() + e.getLength() - 1).fill(0);
    for (let i = 0; i < this.getLength(); i++) {
      for (let j = 0; j < e.getLength(); j++) {
        num[i + j] ^= gexp(glog(this.get(i)) + glog(e.get(j)));
      }
    }
    return new QRPolynomial(num);
  }
  mod(e: QRPolynomial): QRPolynomial {
    if (this.getLength() - e.getLength() < 0) return this;
    const ratio = glog(this.get(0)) - glog(e.get(0));
    const num = new Array(this.getLength());
    for (let i = 0; i < this.getLength(); i++) num[i] = this.get(i);
    for (let i = 0; i < e.getLength(); i++) {
      num[i] ^= gexp(glog(e.get(i)) + ratio);
    }
    return new QRPolynomial(num).mod(e);
  }
}

class QRRSBlock {
  totalCount: number;
  dataCount: number;
  constructor(totalCount: number, dataCount: number) {
    this.totalCount = totalCount;
    this.dataCount = dataCount;
  }
  static getRSBlocks(version: number, errorCorrectionLevel: number): QRRSBlock[] {
    const rsBlock = QRRSBlock.getRsBlockTable(version, errorCorrectionLevel);
    if (!rsBlock) throw new Error(`bad RS block @ version: ${version} / ec: ${errorCorrectionLevel}`);
    const length = rsBlock.length / 3;
    const list: QRRSBlock[] = [];
    for (let i = 0; i < length; i++) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j++) list.push(new QRRSBlock(totalCount, dataCount));
    }
    return list;
  }
  static getRsBlockTable(v: number, ec: number): number[] | null {
    const table: Record<number, number[][]> = {
      1: [[1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9]],
      2: [[1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16]],
      3: [[1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13]],
      4: [[1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9]],
      5: [[1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12]],
      6: [[2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15]],
      7: [[2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14]],
      8: [[2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15]],
      9: [[2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13]],
      10: [[2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16]]
    };
    const row = table[v];
    if (!row) return null;
    return row[ec === 1 ? 0 : ec === 0 ? 1 : ec === 3 ? 2 : 3];
  }
}

class QRBitBuffer {
  buffer: number[] = [];
  length = 0;
  get(index: number) {
    const bufIndex = Math.floor(index / 8);
    return ((this.buffer[bufIndex] >>> (7 - (index % 8))) & 1) === 1;
  }
  put(num: number, len: number) {
    for (let i = 0; i < len; i++) {
      this.putBit(((num >>> (len - i - 1)) & 1) === 1);
    }
  }
  putBit(bit: boolean) {
    const bufIndex = Math.floor(this.length / 8);
    if (this.buffer.length <= bufIndex) this.buffer.push(0);
    if (bit) this.buffer[bufIndex] |= (0x80 >>> (this.length % 8));
    this.length++;
  }
}

class QRCodeModel {
  typeNumber: number;
  errorCorrectionLevel: number;
  modules: boolean[][] | null = null;
  moduleCount = 0;
  dataList: string[] = [];

  constructor(typeNumber: number, errorCorrectionLevel: number) {
    this.typeNumber = typeNumber;
    this.errorCorrectionLevel = errorCorrectionLevel;
  }
  addData(data: string) {
    this.dataList.push(data);
  }
  isDark(row: number, col: number): boolean {
    return !!this.modules?.[row]?.[col];
  }
  getModuleCount() {
    return this.moduleCount;
  }
  make() {
    this.makeImpl(false, this.getBestMaskPattern());
  }
  makeImpl(test: boolean, maskPattern: number) {
    this.moduleCount = this.typeNumber * 4 + 17;
    this.modules = Array.from({ length: this.moduleCount }, () => new Array(this.moduleCount).fill(null as any));

    this.setupPositionProbePattern(0, 0);
    this.setupPositionProbePattern(this.moduleCount - 7, 0);
    this.setupPositionProbePattern(0, this.moduleCount - 7);
    this.setupPositionAdjustPattern();
    this.setupTimingPattern();
    this.setupTypeInfo(test, maskPattern);

    if (this.typeNumber >= 7) {
      this.setupTypeNumber(test);
    }

    const data = QRCodeModel.createData(this.typeNumber, this.errorCorrectionLevel, this.dataList);
    this.mapData(data, maskPattern);
  }
  setupPositionProbePattern(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      if (row + r <= -1 || this.moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c++) {
        if (col + c <= -1 || this.moduleCount <= col + c) continue;
        if (
          (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
          (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
          (2 <= r && r <= 4 && 2 <= c && c <= 4)
        ) {
          this.modules![row + r][col + c] = true;
        } else {
          this.modules![row + r][col + c] = false;
        }
      }
    }
  }
  getBestMaskPattern() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i++) {
      this.makeImpl(true, i);
      const lostPoint = QRCodeModel.getLostPoint(this);
      if (i === 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  }
  setupTimingPattern() {
    for (let r = 8; r < this.moduleCount - 8; r++) {
      if (this.modules![r][6] != null) continue;
      this.modules![r][6] = r % 2 === 0;
    }
    for (let c = 8; c < this.moduleCount - 8; c++) {
      if (this.modules![6][c] != null) continue;
      this.modules![6][c] = c % 2 === 0;
    }
  }
  setupPositionAdjustPattern() {
    const pos = QRCodeModel.getPatternPosition(this.typeNumber);
    for (let i = 0; i < pos.length; i++) {
      for (let j = 0; j < pos.length; j++) {
        const row = pos[i];
        const col = pos[j];
        if (this.modules![row][col] != null) continue;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
              this.modules![row + r][col + c] = true;
            } else {
              this.modules![row + r][col + c] = false;
            }
          }
        }
      }
    }
  }
  setupTypeInfo(test: boolean, maskPattern: number) {
    const data = (this.errorCorrectionLevel << 3) | maskPattern;
    const bits = QRCodeModel.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      if (i < 6) this.modules![i][8] = mod;
      else if (i < 8) this.modules![i + 1][8] = mod;
      else this.modules![this.moduleCount - 15 + i][8] = mod;

      if (i < 8) this.modules![8][this.moduleCount - i - 1] = mod;
      else if (i < 9) this.modules![8][15 - i - 1 + 1] = mod;
      else this.modules![8][15 - i - 1] = mod;
    }
    this.modules![this.moduleCount - 8][8] = !test;
  }
  setupTypeNumber(test: boolean) {
    const bits = QRCodeModel.getBCHTypeNumber(this.typeNumber);
    for (let i = 0; i < 18; i++) {
      const mod = !test && ((bits >> i) & 1) === 1;
      this.modules![Math.floor(i / 3)][(i % 3) + this.moduleCount - 8 - 3] = mod;
      this.modules![(i % 3) + this.moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  }
  mapData(data: number[], maskPattern: number) {
    let inc = -1;
    let row = this.moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    const mask = QRCodeModel.getMaskFunction(maskPattern);

    for (let col = this.moduleCount - 1; col > 0; col -= 2) {
      if (col === 6) col--;
      while (true) {
        for (let c = 0; c < 2; c++) {
          if (this.modules![row][col - c] == null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = ((data[byteIndex] >>> bitIndex) & 1) === 1;
            }
            if (mask(row, col - c)) dark = !dark;
            this.modules![row][col - c] = dark;
            bitIndex--;
            if (bitIndex === -1) {
              byteIndex++;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || this.moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  }
  static createData(typeNumber: number, errorCorrectionLevel: number, dataList: string[]) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);
    const buffer = new QRBitBuffer();
    for (let i = 0; i < dataList.length; i++) {
      const data = dataList[i];
      buffer.put(QRMode.BYTE, 4);
      buffer.put(data.length, typeNumber < 10 ? 8 : 16);
      for (let j = 0; j < data.length; j++) {
        buffer.put(data.charCodeAt(j), 8);
      }
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i++) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.length + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.length % 8 !== 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0xec, 8);
      if (buffer.length >= totalDataCount * 8) break;
      buffer.put(0x11, 8);
    }
    return QRCodeModel.createBytes(buffer, rsBlocks);
  }
  static createBytes(buffer: QRBitBuffer, rsBlocks: QRRSBlock[]) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);

    for (let r = 0; r < rsBlocks.length; r++) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i++) {
        dcdata[r][i] = 0xff & buffer.buffer[i + offset];
      }
      offset += dcCount;

      const rsPoly = QRCodeModel.getErrorCorrectPolynomial(ecCount);
      const rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i++) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
      }
    }

    const data: number[] = [];
    for (let i = 0; i < maxDcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < dcdata[r].length) data.push(dcdata[r][i]);
      }
    }
    for (let i = 0; i < maxEcCount; i++) {
      for (let r = 0; r < rsBlocks.length; r++) {
        if (i < ecdata[r].length) data.push(ecdata[r][i]);
      }
    }
    return data;
  }
  static getErrorCorrectPolynomial(errorCorrectLength: number) {
    let a = new QRPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i++) {
      a = a.multiply(new QRPolynomial([1, gexp(i)], 0));
    }
    return a;
  }
  static getMaskFunction(maskPattern: number): (r: number, c: number) => boolean {
    switch (maskPattern) {
      case 0: return (r, c) => (r + c) % 2 === 0;
      case 1: return (r) => r % 2 === 0;
      case 2: return (_, c) => c % 3 === 0;
      case 3: return (r, c) => (r + c) % 3 === 0;
      case 4: return (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0;
      case 5: return (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0;
      case 6: return (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0;
      case 7: return (r, c) => (((r * c) % 3) + ((r + c) % 2)) % 2 === 0;
      default: throw new Error('bad maskPattern: ' + maskPattern);
    }
  }
  static getLostPoint(qrCode: QRCodeModel) {
    const moduleCount = qrCode.getModuleCount();
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        let sameCount = 0;
        const dark = qrCode.isDark(row, col);
        for (let r = -1; r <= 1; r++) {
          if (row + r < 0 || moduleCount <= row + r) continue;
          for (let c = -1; c <= 1; c++) {
            if (col + c < 0 || moduleCount <= col + c) continue;
            if (r === 0 && c === 0) continue;
            if (dark === qrCode.isDark(row + r, col + c)) sameCount++;
          }
        }
        if (sameCount > 5) lostPoint += 3 + sameCount - 5;
      }
    }
    return lostPoint;
  }
  static getPatternPosition(typeNumber: number) {
    const patternPositions = [
      [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
      [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]
    ];
    return patternPositions[typeNumber] || [];
  }
  static getBCHTypeInfo(data: number) {
    let d = data << 10;
    while (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(1335) >= 0) {
      d ^= 1335 << (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(1335));
    }
    return ((data << 10) | d) ^ 21522;
  }
  static getBCHTypeNumber(data: number) {
    let d = data << 12;
    while (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(7973) >= 0) {
      d ^= 7973 << (QRCodeModel.getBCHDigit(d) - QRCodeModel.getBCHDigit(7973));
    }
    return (data << 12) | d;
  }
  static getBCHDigit(data: number) {
    let digit = 0;
    while (data !== 0) {
      digit++;
      data >>>= 1;
    }
    return digit;
  }
}

export const ClientQrCode: React.FC<ClientQrCodeProps> = ({
  value,
  size = 180,
  className = '',
  level = 'M',
  margin = 2,
  bgColor = '#ffffff',
  fgColor = '#0f172a',
}) => {
  const { pathData, totalSize } = useMemo(() => {
    if (!value) return { pathData: '', totalSize: 21 + margin * 2 };
    try {
      const ec = QRErrorCorrectionLevel[level] ?? QRErrorCorrectionLevel.M;
      let qr: QRCodeModel | null = null;
      for (let v = 1; v <= 10; v++) {
        try {
          const candidate = new QRCodeModel(v, ec);
          candidate.addData(value);
          candidate.make();
          qr = candidate;
          break;
        } catch {
          // try next version
        }
      }
      if (!qr) return { pathData: '', totalSize: 21 + margin * 2 };

      const count = qr.getModuleCount();
      let path = '';
      for (let r = 0; r < count; r++) {
        for (let c = 0; c < count; c++) {
          if (qr.isDark(r, c)) {
            const x = c + margin;
            const y = r + margin;
            path += `M${x},${y}h1v1h-1z `;
          }
        }
      }
      return { pathData: path, totalSize: count + margin * 2 };
    } catch (e) {
      console.warn('QR Code generation failed for string:', value, e);
      return { pathData: '', totalSize: 21 + margin * 2 };
    }
  }, [value, level, margin]);

  if (!value || !pathData) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center bg-neutral-surface-alt dark:bg-slate-800 rounded-xl border border-neutral-border text-[11px] text-neutral-secondary p-2 text-center ${className}`}
      >
        <span>No QR data available</span>
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${totalSize} ${totalSize}`}
      width={size}
      height={size}
      className={`rounded-xl shadow-sm ${className}`}
      style={{ background: bgColor }}
      shapeRendering="crispEdges"
      role="img"
      aria-label={`QR code for ${value}`}
    >
      <rect width="100%" height="100%" fill={bgColor} />
      <path d={pathData} fill={fgColor} />
    </svg>
  );
};
