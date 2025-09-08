import CryptoJS from 'crypto-js';

export interface EncryptionConfig {
  algorithm: string;
  keySize: number;
  iterations: number;
}

export interface EncryptedData {
  data: string;
  salt: string;
  iv: string;
  algorithm: string;
  keySize: number;
  iterations: number;
}

export class EncryptionService {
  private static readonly DEFAULT_CONFIG: EncryptionConfig = {
    algorithm: 'AES-256-GCM',
    keySize: 256 / 32, // 256 bits = 8 words of 32 bits each
    iterations: 10000,
  };

  /**
   * Encrypts data using AES-256 with PBKDF2 key derivation
   */
  static encrypt(data: string, password: string, config: EncryptionConfig = this.DEFAULT_CONFIG): EncryptedData {
    try {
      // Generate random salt and IV
      const salt = CryptoJS.lib.WordArray.random(128 / 8);
      const iv = CryptoJS.lib.WordArray.random(128 / 8);

      // Derive key using PBKDF2
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: config.keySize,
        iterations: config.iterations,
      });

      // Encrypt the data
      const encrypted = CryptoJS.AES.encrypt(data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return {
        data: encrypted.toString(),
        salt: salt.toString(),
        iv: iv.toString(),
        algorithm: config.algorithm,
        keySize: config.keySize,
        iterations: config.iterations,
      };
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypts data using the stored parameters
   */
  static decrypt(encryptedData: EncryptedData, password: string): string {
    try {
      // Parse the stored parameters
      const salt = CryptoJS.enc.Hex.parse(encryptedData.salt);
      const iv = CryptoJS.enc.Hex.parse(encryptedData.iv);

      // Derive the same key using stored parameters
      const key = CryptoJS.PBKDF2(password, salt, {
        keySize: encryptedData.keySize,
        iterations: encryptedData.iterations,
      });

      // Decrypt the data
      const decrypted = CryptoJS.AES.decrypt(encryptedData.data, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const decryptedString = decrypted.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) {
        throw new Error('Invalid password or corrupted data');
      }

      return decryptedString;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypts a file buffer
   */
  static encryptFile(fileBuffer: ArrayBuffer, password: string): EncryptedData {
    const wordArray = CryptoJS.lib.WordArray.create(fileBuffer);
    const base64Data = CryptoJS.enc.Base64.stringify(wordArray);
    return this.encrypt(base64Data, password);
  }

  /**
   * Decrypts a file and returns the buffer
   */
  static decryptFile(encryptedData: EncryptedData, password: string): ArrayBuffer {
    const base64Data = this.decrypt(encryptedData, password);
    const wordArray = CryptoJS.enc.Base64.parse(base64Data);
    return this.wordArrayToArrayBuffer(wordArray);
  }

  /**
   * Generates a secure random password
   */
  static generatePassword(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = (randomBytes.words[Math.floor(i / 4)] >>> (8 * (i % 4))) & 0xff;
      result += charset[randomIndex % charset.length];
    }
    
    return result;
  }

  /**
   * Hashes a password using PBKDF2
   */
  static hashPassword(password: string, salt?: string): { hash: string; salt: string } {
    const actualSalt = salt || CryptoJS.lib.WordArray.random(128 / 8).toString();
    const hash = CryptoJS.PBKDF2(password, actualSalt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    return { hash, salt: actualSalt };
  }

  /**
   * Verifies a password against a hash
   */
  static verifyPassword(password: string, hash: string, salt: string): boolean {
    const computedHash = CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 10000,
    }).toString();

    return computedHash === hash;
  }

  /**
   * Calculates file checksum for integrity verification
   */
  static calculateChecksum(data: string | ArrayBuffer): string {
    if (data instanceof ArrayBuffer) {
      const wordArray = CryptoJS.lib.WordArray.create(data);
      return CryptoJS.SHA256(wordArray).toString();
    }
    return CryptoJS.SHA256(data).toString();
  }

  /**
   * Converts WordArray to ArrayBuffer
   */
  private static wordArrayToArrayBuffer(wordArray: CryptoJS.lib.WordArray): ArrayBuffer {
    const arrayBuffer = new ArrayBuffer(wordArray.sigBytes);
    const uint8Array = new Uint8Array(arrayBuffer);
    
    for (let i = 0; i < wordArray.sigBytes; i++) {
      const byte = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
      uint8Array[i] = byte;
    }
    
    return arrayBuffer;
  }

  /**
   * Securely wipes sensitive data from memory
   */
  static wipeData(data: any): void {
    if (typeof data === 'string') {
      // Can't actually wipe strings in JavaScript, but we can try to overwrite references
      data = '';
    } else if (data instanceof ArrayBuffer) {
      const view = new Uint8Array(data);
      for (let i = 0; i < view.length; i++) {
        view[i] = 0;
      }
    }
  }
}