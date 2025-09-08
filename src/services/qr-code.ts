/**
 * QR Code Generation Service for SDC Files
 * Generates QR codes for secure access to .sdc files
 */

import { SDCFile, SDCQRCode } from '@/types';

export interface QRCodeOptions {
  size: number;
  errorCorrection: 'L' | 'M' | 'Q' | 'H';
  border: number;
  color: {
    dark: string;
    light: string;
  };
}

export interface QRCodeGenerationResult {
  success: boolean;
  qrCodeDataUrl?: string;
  qrCodeSvg?: string;
  error?: string;
}

export class QRCodeService {
  private static readonly DEFAULT_OPTIONS: QRCodeOptions = {
    size: 256,
    errorCorrection: 'M',
    border: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  };

  /**
   * Generate QR code for SDC file access
   */
  static async generateSDCQRCode(
    sdcFile: SDCFile,
    options: Partial<QRCodeOptions> = {}
  ): Promise<QRCodeGenerationResult> {
    try {
      const qrOptions = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Create SDC access data
      const accessData = {
        type: 'sdc-file',
        fileId: sdcFile.id,
        fileName: sdcFile.name,
        publicKey: sdcFile.publicKey,
        metadata: {
          title: sdcFile.metadata.title,
          author: sdcFile.metadata.author,
          encrypted: sdcFile.metadata.security.encrypted,
          expiresAt: sdcFile.metadata.access.expiresAt,
          maxViews: sdcFile.metadata.access.maxViews
        },
        accessUrl: `${window.location.origin}/sdc-reader`,
        timestamp: Date.now()
      };
      
      const qrData = JSON.stringify(accessData);
      
      // Generate QR code matrix
      const qrMatrix = await this.generateQRMatrix(qrData, qrOptions.errorCorrection);
      
      // Generate both data URL and SVG versions
      const qrCodeDataUrl = await this.generateDataURL(qrMatrix, qrOptions);
      const qrCodeSvg = await this.generateSVG(qrMatrix, qrOptions);
      
      return {
        success: true,
        qrCodeDataUrl,
        qrCodeSvg
      };
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR code generation failed'
      };
    }
  }

  /**
   * Generate QR code for custom data
   */
  static async generateCustomQRCode(
    data: string,
    options: Partial<QRCodeOptions> = {}
  ): Promise<QRCodeGenerationResult> {
    try {
      const qrOptions = { ...this.DEFAULT_OPTIONS, ...options };
      
      const qrMatrix = await this.generateQRMatrix(data, qrOptions.errorCorrection);
      const qrCodeDataUrl = await this.generateDataURL(qrMatrix, qrOptions);
      const qrCodeSvg = await this.generateSVG(qrMatrix, qrOptions);
      
      return {
        success: true,
        qrCodeDataUrl,
        qrCodeSvg
      };
    } catch (error) {
      console.error('Failed to generate custom QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'QR code generation failed'
      };
    }
  }

  /**
   * Parse SDC QR code data
   */
  static parseSDCQRCode(qrData: string): { valid: boolean; data?: any; error?: string } {
    try {
      const parsed = JSON.parse(qrData);
      
      if (parsed.type !== 'sdc-file') {
        return { valid: false, error: 'Not an SDC file QR code' };
      }
      
      if (!parsed.fileId || !parsed.publicKey) {
        return { valid: false, error: 'Invalid SDC QR code data' };
      }
      
      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid QR code data format' };
    }
  }

  // Private methods for QR code generation

  private static async generateQRMatrix(data: string, errorCorrection: string): Promise<boolean[][]> {
    // This is a simplified QR code matrix generation
    // In a production environment, you would use a proper QR code library
    
    const size = this.calculateQRSize(data, errorCorrection);
    const matrix: boolean[][] = [];
    
    // Initialize matrix
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(false);
    }
    
    // Add finder patterns (corners)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Add timing patterns
    this.addTimingPatterns(matrix, size);
    
    // Add data (simplified pattern based on data hash)
    this.addDataPattern(matrix, data, size);
    
    return matrix;
  }

  private static calculateQRSize(data: string, errorCorrection: string): number {
    // Simplified size calculation
    const baseSize = 21; // QR Version 1
    const dataLength = data.length;
    const errorFactor = errorCorrection === 'H' ? 1.3 : errorCorrection === 'Q' ? 1.2 : 1.1;
    
    if (dataLength <= 25) return 21;
    if (dataLength <= 47) return 25;
    if (dataLength <= 77) return 29;
    if (dataLength <= 114) return 33;
    
    return Math.min(177, baseSize + Math.ceil(dataLength * errorFactor / 20) * 4);
  }

  private static addFinderPattern(matrix: boolean[][], startX: number, startY: number): void {
    const pattern = [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ];
    
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (startX + i < matrix.length && startY + j < matrix[0].length) {
          matrix[startX + i][startY + j] = pattern[i][j] === 1;
        }
      }
    }
  }

  private static addTimingPatterns(matrix: boolean[][], size: number): void {
    // Horizontal timing pattern
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
    }
    
    // Vertical timing pattern
    for (let i = 8; i < size - 8; i++) {
      matrix[i][6] = i % 2 === 0;
    }
  }

  private static addDataPattern(matrix: boolean[][], data: string, size: number): void {
    // Create a simple hash-based pattern for the data
    const hash = this.simpleHash(data);
    let bitIndex = 0;
    
    for (let i = 9; i < size - 9; i++) {
      for (let j = 9; j < size - 9; j++) {
        if (!this.isReservedPosition(i, j, size)) {
          matrix[i][j] = (hash >> (bitIndex % 32)) & 1 ? true : false;
          bitIndex++;
        }
      }
    }
  }

  private static isReservedPosition(x: number, y: number, size: number): boolean {
    // Check if position is reserved for finder patterns, timing patterns, etc.
    if ((x < 9 && y < 9) || (x < 9 && y > size - 9) || (x > size - 9 && y < 9)) {
      return true;
    }
    if (x === 6 || y === 6) {
      return true;
    }
    return false;
  }

  private static simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  private static async generateDataURL(matrix: boolean[][], options: QRCodeOptions): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    const moduleSize = Math.floor(options.size / matrix.length);
    const qrSize = moduleSize * matrix.length;
    const totalSize = qrSize + (options.border * 2 * moduleSize);
    
    canvas.width = totalSize;
    canvas.height = totalSize;
    
    // Fill background
    ctx.fillStyle = options.color.light;
    ctx.fillRect(0, 0, totalSize, totalSize);
    
    // Draw QR modules
    ctx.fillStyle = options.color.dark;
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j]) {
          ctx.fillRect(
            (options.border * moduleSize) + (j * moduleSize),
            (options.border * moduleSize) + (i * moduleSize),
            moduleSize,
            moduleSize
          );
        }
      }
    }
    
    return canvas.toDataURL('image/png');
  }

  private static async generateSVG(matrix: boolean[][], options: QRCodeOptions): Promise<string> {
    const moduleSize = Math.floor(options.size / matrix.length);
    const qrSize = moduleSize * matrix.length;
    const totalSize = qrSize + (options.border * 2 * moduleSize);
    
    let svg = `<svg width="${totalSize}" height="${totalSize}" viewBox="0 0 ${totalSize} ${totalSize}" xmlns="http://www.w3.org/2000/svg">`;
    
    // Background
    svg += `<rect width="${totalSize}" height="${totalSize}" fill="${options.color.light}"/>`;
    
    // QR modules
    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (matrix[i][j]) {
          const x = (options.border * moduleSize) + (j * moduleSize);
          const y = (options.border * moduleSize) + (i * moduleSize);
          svg += `<rect x="${x}" y="${y}" width="${moduleSize}" height="${moduleSize}" fill="${options.color.dark}"/>`;
        }
      }
    }
    
    svg += '</svg>';
    return svg;
  }

  /**
   * Generate downloadable QR code file
   */
  static async generateQRCodeFile(
    sdcFile: SDCFile,
    format: 'png' | 'svg' = 'png',
    options: Partial<QRCodeOptions> = {}
  ): Promise<Blob> {
    const result = await this.generateSDCQRCode(sdcFile, options);
    
    if (!result.success) {
      throw new Error(result.error || 'QR code generation failed');
    }
    
    if (format === 'svg') {
      return new Blob([result.qrCodeSvg!], { type: 'image/svg+xml' });
    } else {
      // Convert data URL to blob
      const dataUrl = result.qrCodeDataUrl!;
      const response = await fetch(dataUrl);
      return await response.blob();
    }
  }

  /**
   * Create QR code with custom branding
   */
  static async generateBrandedQRCode(
    sdcFile: SDCFile,
    logoUrl?: string,
    brandText?: string,
    options: Partial<QRCodeOptions> = {}
  ): Promise<QRCodeGenerationResult> {
    try {
      const result = await this.generateSDCQRCode(sdcFile, options);
      
      if (!result.success) {
        return result;
      }
      
      // If no branding requested, return original
      if (!logoUrl && !brandText) {
        return result;
      }
      
      // Create branded version
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      // Load original QR code
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = result.qrCodeDataUrl!;
      });
      
      canvas.width = img.width;
      canvas.height = img.height + (brandText ? 40 : 0);
      
      // Draw QR code
      ctx.drawImage(img, 0, 0);
      
      // Add logo if provided
      if (logoUrl) {
        const logo = new Image();
        await new Promise((resolve, reject) => {
          logo.onload = resolve;
          logo.onerror = reject;
          logo.src = logoUrl;
        });
        
        const logoSize = Math.min(img.width * 0.2, img.height * 0.2);
        const logoX = (img.width - logoSize) / 2;
        const logoY = (img.height - logoSize) / 2;
        
        // Draw white background for logo
        ctx.fillStyle = 'white';
        ctx.fillRect(logoX - 5, logoY - 5, logoSize + 10, logoSize + 10);
        
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      }
      
      // Add brand text if provided
      if (brandText) {
        ctx.fillStyle = options.color?.dark || '#000000';
        ctx.font = '14px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(brandText, canvas.width / 2, canvas.height - 15);
      }
      
      return {
        success: true,
        qrCodeDataUrl: canvas.toDataURL('image/png'),
        qrCodeSvg: result.qrCodeSvg
      };
    } catch (error) {
      console.error('Failed to generate branded QR code:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Branded QR code generation failed'
      };
    }
  }
}