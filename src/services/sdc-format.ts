/**
 * SDC (Secure Data Compiler) File Format Service
 * Implements the proprietary .sdc format with encryption, truncation, and key management
 */

import { EncryptionService, EncryptedData } from './encryption';
import { SDCFile, SDCMetadata, SDCQRCode, DigitalSignature } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface SDCExportOptions {
  compressionLevel: 'none' | 'low' | 'medium' | 'high';
  encryptionEnabled: boolean;
  keyDerivationRounds: number;
  expirationDate?: Date;
  maxViews?: number;
  requiresPassword: boolean;
  generateQRCode: boolean;
}

export interface SDCDecryptionResult {
  success: boolean;
  data?: ArrayBuffer;
  metadata?: SDCMetadata;
  error?: string;
  viewsRemaining?: number;
}

export class SDCFormatService {
  private static readonly SDC_VERSION = '1.0';
  private static readonly SDC_MAGIC_BYTES = new Uint8Array([0x53, 0x44, 0x43, 0x01]); // "SDC" + version
  private static readonly STORAGE_KEY = 'sdc_files';
  
  /**
   * Convert any file to .sdc format with full encryption and truncation
   */
  static async createSDCFile(
    originalData: ArrayBuffer,
    originalFilename: string,
    metadata: Partial<SDCMetadata>,
    options: SDCExportOptions
  ): Promise<SDCFile> {
    try {
      // Generate keypair for this file
      const keyPair = await this.generateKeyPair();
      
      // Compress data if requested
      let processedData = originalData;
      if (options.compressionLevel !== 'none') {
        processedData = await this.compressData(originalData, options.compressionLevel);
      }
      
      // Encrypt the data
      let encryptedData: ArrayBuffer;
      if (options.encryptionEnabled) {
        const encryptionKey = await this.deriveEncryptionKey(keyPair.privateKey, options.keyDerivationRounds);
        encryptedData = await this.encryptData(processedData, encryptionKey);
      } else {
        encryptedData = processedData;
      }
      
      // Create complete metadata
      const fullMetadata: SDCMetadata = {
        title: metadata.title || originalFilename,
        description: metadata.description || '',
        author: metadata.author || 'Anonymous',
        version: this.SDC_VERSION,
        tags: metadata.tags || [],
        security: {
          encrypted: options.encryptionEnabled,
          compressionAlgorithm: options.compressionLevel,
          encryptionAlgorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2-SHA256'
        },
        access: {
          requiresKey: options.encryptionEnabled,
          expiresAt: options.expirationDate,
          maxViews: options.maxViews,
          viewCount: 0
        }
      };
      
      // Create digital signature
      const signature = await this.createDigitalSignature(encryptedData, keyPair.privateKey, fullMetadata);
      
      // Create SDC file object
      const sdcFile: SDCFile = {
        id: uuidv4(),
        name: this.convertToSDCFilename(originalFilename),
        originalFormat: this.getFileExtension(originalFilename),
        encryptedData,
        publicKey: keyPair.publicKey,
        privateKeyHash: await this.hashPrivateKey(keyPair.privateKey),
        metadata: fullMetadata,
        signature,
        createdAt: new Date(),
        lastModified: new Date()
      };
      
      // Store in vault (all files saved as .sdc until exported)
      await this.storeSDCFile(sdcFile);
      
      return sdcFile;
    } catch (error) {
      console.error('Failed to create SDC file:', error);
      throw new Error('SDC file creation failed');
    }
  }
  
  /**
   * Read and decrypt .sdc file
   */
  static async readSDCFile(
    sdcFile: SDCFile,
    privateKey?: string,
    password?: string
  ): Promise<SDCDecryptionResult> {
    try {
      // Check access restrictions
      const accessCheck = await this.checkAccessRestrictions(sdcFile);
      if (!accessCheck.allowed) {
        return {
          success: false,
          error: accessCheck.reason
        };
      }
      
      // Verify digital signature
      const signatureValid = await this.verifyDigitalSignature(
        sdcFile.encryptedData,
        sdcFile.signature,
        sdcFile.publicKey,
        sdcFile.metadata
      );
      
      if (!signatureValid) {
        return {
          success: false,
          error: 'File signature verification failed - file may be corrupted or tampered with'
        };
      }
      
      let decryptedData: ArrayBuffer;
      
      if (sdcFile.metadata.security.encrypted) {
        if (!privateKey && !password) {
          return {
            success: false,
            error: 'Private key or password required for encrypted file'
          };
        }
        
        // Derive decryption key
        let decryptionKey: string;
        if (privateKey) {
          // Verify private key matches
          const keyHash = await this.hashPrivateKey(privateKey);
          if (keyHash !== sdcFile.privateKeyHash) {
            return {
              success: false,
              error: 'Invalid private key'
            };
          }
          decryptionKey = await this.deriveEncryptionKey(privateKey, 100000);
        } else if (password) {
          decryptionKey = await this.derivePasswordKey(password, sdcFile.id);
        } else {
          return {
            success: false,
            error: 'Authentication failed'
          };
        }
        
        // Decrypt data
        decryptedData = await this.decryptData(sdcFile.encryptedData, decryptionKey);
      } else {
        decryptedData = sdcFile.encryptedData;
      }
      
      // Decompress if needed
      if (sdcFile.metadata.security.compressionAlgorithm !== 'none') {
        decryptedData = await this.decompressData(decryptedData, sdcFile.metadata.security.compressionAlgorithm);
      }
      
      // Update view count
      await this.incrementViewCount(sdcFile.id);
      
      return {
        success: true,
        data: decryptedData,
        metadata: sdcFile.metadata,
        viewsRemaining: sdcFile.metadata.access.maxViews 
          ? sdcFile.metadata.access.maxViews - (sdcFile.metadata.access.viewCount + 1)
          : undefined
      };
    } catch (error) {
      console.error('Failed to read SDC file:', error);
      return {
        success: false,
        error: 'Failed to decrypt file'
      };
    }
  }
  
  /**
   * Generate QR code for .sdc file access
   */
  static async generateQRCode(sdcFile: SDCFile, baseUrl: string = window.location.origin): Promise<SDCQRCode> {
    const qrData = {
      fileId: sdcFile.id,
      publicKey: sdcFile.publicKey,
      accessUrl: `${baseUrl}/sdc-reader?file=${sdcFile.id}&key=${encodeURIComponent(sdcFile.publicKey)}`,
      metadata: {
        title: sdcFile.metadata.title,
        author: sdcFile.metadata.author,
        encrypted: sdcFile.metadata.security.encrypted
      }
    };
    
    const qrCodeData = JSON.stringify(qrData);
    
    const qrCode: SDCQRCode = {
      fileId: sdcFile.id,
      publicKey: sdcFile.publicKey,
      accessUrl: qrData.accessUrl,
      qrCodeData,
      expiresAt: sdcFile.metadata.access.expiresAt,
      maxUses: sdcFile.metadata.access.maxViews,
      useCount: 0
    };
    
    return qrCode;
  }
  
  /**
   * Export .sdc file for external use (fully truncated outside app)
   */
  static async exportSDCFile(sdcFile: SDCFile): Promise<Blob> {
    // Create the complete .sdc file structure
    const sdcContainer = {
      magic: Array.from(this.SDC_MAGIC_BYTES),
      version: this.SDC_VERSION,
      fileId: sdcFile.id,
      metadata: sdcFile.metadata,
      publicKey: sdcFile.publicKey,
      privateKeyHash: sdcFile.privateKeyHash,
      signature: sdcFile.signature,
      dataSize: sdcFile.encryptedData.byteLength,
      data: Array.from(new Uint8Array(sdcFile.encryptedData))
    };
    
    const sdcJson = JSON.stringify(sdcContainer);
    const sdcBytes = new TextEncoder().encode(sdcJson);
    
    // Add header and footer for file validation
    const header = new TextEncoder().encode('SDC-FILE-BEGIN\n');
    const footer = new TextEncoder().encode('\nSDC-FILE-END');
    
    const finalFile = new Uint8Array(header.length + sdcBytes.length + footer.length);
    finalFile.set(header, 0);
    finalFile.set(sdcBytes, header.length);
    finalFile.set(footer, header.length + sdcBytes.length);
    
    return new Blob([finalFile], { type: 'application/sdc' });
  }
  
  /**
   * Import .sdc file from external source
   */
  static async importSDCFile(fileData: ArrayBuffer): Promise<SDCFile> {
    try {
      // Validate file format
      const header = new TextDecoder().decode(fileData.slice(0, 15));
      if (header !== 'SDC-FILE-BEGIN\n') {
        throw new Error('Invalid SDC file format');
      }
      
      // Extract JSON data
      const footerStart = fileData.byteLength - 13;
      const footer = new TextDecoder().decode(fileData.slice(footerStart));
      if (footer !== '\nSDC-FILE-END') {
        throw new Error('Corrupted SDC file');
      }
      
      const jsonData = new TextDecoder().decode(fileData.slice(15, footerStart));
      const sdcContainer = JSON.parse(jsonData);
      
      // Validate magic bytes
      const magic = new Uint8Array(sdcContainer.magic);
      if (!this.arrayEquals(magic, this.SDC_MAGIC_BYTES)) {
        throw new Error('Invalid SDC file format');
      }
      
      // Reconstruct SDC file
      const sdcFile: SDCFile = {
        id: sdcContainer.fileId,
        name: `imported_${Date.now()}.sdc`,
        originalFormat: sdcContainer.metadata.originalFormat || 'unknown',
        encryptedData: new Uint8Array(sdcContainer.data).buffer,
        publicKey: sdcContainer.publicKey,
        privateKeyHash: sdcContainer.privateKeyHash,
        metadata: sdcContainer.metadata,
        signature: sdcContainer.signature,
        createdAt: new Date(sdcContainer.createdAt || Date.now()),
        lastModified: new Date()
      };
      
      return sdcFile;
    } catch (error) {
      console.error('Failed to import SDC file:', error);
      throw new Error('Invalid or corrupted SDC file');
    }
  }
  
  // Private helper methods
  
  private static async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-PSS',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['sign', 'verify']
    );
    
    const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
    
    return {
      publicKey: this.arrayBufferToBase64(publicKey),
      privateKey: this.arrayBufferToBase64(privateKey)
    };
  }
  
  private static async deriveEncryptionKey(privateKey: string, rounds: number): Promise<string> {
    const keyBytes = this.base64ToArrayBuffer(privateKey);
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: keyBytes.slice(0, 16),
        iterations: rounds,
        hash: 'SHA-256'
      },
      await crypto.subtle.importKey('raw', keyBytes.slice(16, 48), 'PBKDF2', false, ['deriveKey']),
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    return this.arrayBufferToBase64(exportedKey);
  }
  
  private static async derivePasswordKey(password: string, salt: string): Promise<string> {
    const passwordBytes = new TextEncoder().encode(password);
    const saltBytes = new TextEncoder().encode(salt);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBytes,
      'PBKDF2',
      false,
      ['deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
    return this.arrayBufferToBase64(exportedKey);
  }
  
  private static async encryptData(data: ArrayBuffer, key: string): Promise<ArrayBuffer> {
    const keyBytes = this.base64ToArrayBuffer(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt']);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
    
    // Prepend IV to encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return result.buffer;
  }
  
  private static async decryptData(encryptedData: ArrayBuffer, key: string): Promise<ArrayBuffer> {
    const keyBytes = this.base64ToArrayBuffer(key);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
    
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);
    
    return await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      data
    );
  }
  
  private static async compressData(data: ArrayBuffer, level: string): Promise<ArrayBuffer> {
    // Implement compression based on level
    // For now, return original data (would implement actual compression)
    return data;
  }
  
  private static async decompressData(data: ArrayBuffer, algorithm: string): Promise<ArrayBuffer> {
    // Implement decompression based on algorithm
    // For now, return original data (would implement actual decompression)
    return data;
  }
  
  private static async createDigitalSignature(
    data: ArrayBuffer,
    privateKey: string,
    metadata: SDCMetadata
  ): Promise<string> {
    try {
      const keyBytes = this.base64ToArrayBuffer(privateKey);
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        keyBytes,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['sign']
      );
      
      // Create signature data (data + metadata hash)
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
      const combined = new Uint8Array(data.byteLength + metadataBytes.length);
      combined.set(new Uint8Array(data), 0);
      combined.set(metadataBytes, data.byteLength);
      
      const signature = await crypto.subtle.sign(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        cryptoKey,
        combined
      );
      
      return this.arrayBufferToBase64(signature);
    } catch (error) {
      console.error('Failed to create digital signature:', error);
      throw new Error('Digital signature creation failed');
    }
  }
  
  private static async verifyDigitalSignature(
    data: ArrayBuffer,
    signature: string,
    publicKey: string,
    metadata: SDCMetadata
  ): Promise<boolean> {
    try {
      const keyBytes = this.base64ToArrayBuffer(publicKey);
      const signatureBytes = this.base64ToArrayBuffer(signature);
      
      const cryptoKey = await crypto.subtle.importKey(
        'spki',
        keyBytes,
        {
          name: 'RSA-PSS',
          hash: 'SHA-256'
        },
        false,
        ['verify']
      );
      
      // Recreate signature data
      const metadataBytes = new TextEncoder().encode(JSON.stringify(metadata));
      const combined = new Uint8Array(data.byteLength + metadataBytes.length);
      combined.set(new Uint8Array(data), 0);
      combined.set(metadataBytes, data.byteLength);
      
      return await crypto.subtle.verify(
        {
          name: 'RSA-PSS',
          saltLength: 32
        },
        cryptoKey,
        signatureBytes,
        combined
      );
    } catch (error) {
      console.error('Failed to verify digital signature:', error);
      return false;
    }
  }
  
  private static async hashPrivateKey(privateKey: string): Promise<string> {
    const keyBytes = this.base64ToArrayBuffer(privateKey);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyBytes);
    return this.arrayBufferToBase64(hashBuffer);
  }
  
  private static async checkAccessRestrictions(sdcFile: SDCFile): Promise<{ allowed: boolean; reason?: string }> {
    // Check expiration
    if (sdcFile.metadata.access.expiresAt && new Date() > sdcFile.metadata.access.expiresAt) {
      return { allowed: false, reason: 'File has expired' };
    }
    
    // Check view count
    if (sdcFile.metadata.access.maxViews && sdcFile.metadata.access.viewCount >= sdcFile.metadata.access.maxViews) {
      return { allowed: false, reason: 'Maximum view count exceeded' };
    }
    
    return { allowed: true };
  }
  
  private static async storeSDCFile(sdcFile: SDCFile): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const files = stored ? JSON.parse(stored) : [];
      files.push(sdcFile);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
    } catch (error) {
      console.error('Failed to store SDC file:', error);
      throw new Error('Storage failed');
    }
  }
  
  private static async incrementViewCount(fileId: string): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return;
      
      const files = JSON.parse(stored);
      const fileIndex = files.findIndex((f: SDCFile) => f.id === fileId);
      
      if (fileIndex >= 0) {
        files[fileIndex].metadata.access.viewCount++;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(files));
      }
    } catch (error) {
      console.error('Failed to update view count:', error);
    }
  }
  
  private static convertToSDCFilename(originalFilename: string): string {
    const name = originalFilename.replace(/\.[^/.]+$/, '');
    return `${name}.sdc`;
  }
  
  private static getFileExtension(filename: string): string {
    const match = filename.match(/\.([^/.]+)$/);
    return match ? match[1] : 'unknown';
  }
  
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private static arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}