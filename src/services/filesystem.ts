import { EncryptionService, EncryptedData } from './encryption';
import { SecureFile, FileMetadata, FilePermissions, FileVersion } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface FileSystemConfig {
  maxFileSize: number; // bytes
  allowedTypes: string[];
  encryptionEnabled: boolean;
  versioningEnabled: boolean;
  storageQuota: number; // bytes
}

export interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  availableSpace: number;
  fileCount: number;
  folderCount: number;
}

export class FileSystemService {
  private static readonly DB_NAME = 'SDC_FileSystem';
  private static readonly DB_VERSION = 1;
  private static readonly STORES = {
    files: 'files',
    fileData: 'fileData',
    metadata: 'metadata',
    versions: 'versions',
  };

  private static readonly DEFAULT_CONFIG: FileSystemConfig = {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [], // empty means all types allowed
    encryptionEnabled: true,
    versioningEnabled: true,
    storageQuota: 1024 * 1024 * 1024, // 1GB
  };

  private static db: IDBDatabase | null = null;

  /**
   * Initialize the file system database
   */
  static async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains(this.STORES.files)) {
          const filesStore = db.createObjectStore(this.STORES.files, { keyPath: 'id' });
          filesStore.createIndex('parentId', 'parentId', { unique: false });
          filesStore.createIndex('name', 'name', { unique: false });
          filesStore.createIndex('type', 'type', { unique: false });
          filesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.STORES.fileData)) {
          db.createObjectStore(this.STORES.fileData, { keyPath: 'fileId' });
        }

        if (!db.objectStoreNames.contains(this.STORES.metadata)) {
          db.createObjectStore(this.STORES.metadata, { keyPath: 'fileId' });
        }

        if (!db.objectStoreNames.contains(this.STORES.versions)) {
          const versionsStore = db.createObjectStore(this.STORES.versions, { keyPath: 'id' });
          versionsStore.createIndex('fileId', 'fileId', { unique: false });
          versionsStore.createIndex('version', 'version', { unique: false });
        }
      };
    });
  }

  /**
   * Store a file in the secure file system
   */
  static async storeFile(
    file: File | ArrayBuffer,
    fileName: string,
    parentId?: string,
    password?: string
  ): Promise<SecureFile> {
    await this.ensureInitialized();

    // Validate file
    const fileData = file instanceof File ? await file.arrayBuffer() : file;
    const actualFileName = file instanceof File ? file.name : fileName;
    const fileType = file instanceof File ? file.type : this.getFileTypeFromName(fileName);

    this.validateFile(fileData, fileType);

    // Create file metadata
    const fileId = uuidv4();
    const checksum = EncryptionService.calculateChecksum(fileData);
    
    const secureFile: SecureFile = {
      id: fileId,
      name: actualFileName,
      originalName: actualFileName,
      type: fileType,
      size: fileData.byteLength,
      path: parentId ? `${parentId}/${fileId}` : `/${fileId}`,
      encrypted: this.DEFAULT_CONFIG.encryptionEnabled && !!password,
      checksum,
      version: 1,
      parentId,
      isFolder: false,
      permissions: this.createDefaultPermissions(),
      metadata: this.createDefaultMetadata(),
      versions: [],
      shares: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Encrypt file data if password provided
    let storedData: ArrayBuffer | EncryptedData = fileData;
    if (password && this.DEFAULT_CONFIG.encryptionEnabled) {
      storedData = EncryptionService.encryptFile(fileData, password);
    }

    // Store in database
    await this.executeTransaction([this.STORES.files, this.STORES.fileData], 'readwrite', (transaction) => {
      transaction.objectStore(this.STORES.files).add(secureFile);
      transaction.objectStore(this.STORES.fileData).add({
        fileId,
        data: storedData,
        encrypted: secureFile.encrypted,
      });
    });

    return secureFile;
  }

  /**
   * Retrieve a file from the secure file system
   */
  static async retrieveFile(fileId: string, password?: string): Promise<{ file: SecureFile; data: ArrayBuffer }> {
    await this.ensureInitialized();

    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const fileDataRecord = await this.executeTransaction([this.STORES.fileData], 'readonly', (transaction) => {
      return transaction.objectStore(this.STORES.fileData).get(fileId);
    });

    if (!fileDataRecord) {
      throw new Error('File data not found');
    }

    let fileData: ArrayBuffer;
    if (file.encrypted && password) {
      if (typeof fileDataRecord.data === 'object' && 'data' in fileDataRecord.data) {
        fileData = EncryptionService.decryptFile(fileDataRecord.data as EncryptedData, password);
      } else {
        throw new Error('Invalid encrypted file format');
      }
    } else if (file.encrypted && !password) {
      throw new Error('Password required for encrypted file');
    } else {
      fileData = fileDataRecord.data as ArrayBuffer;
    }

    // Verify integrity
    const computedChecksum = EncryptionService.calculateChecksum(fileData);
    if (computedChecksum !== file.checksum) {
      throw new Error('File integrity check failed');
    }

    return { file, data: fileData };
  }

  /**
   * Create a folder
   */
  static async createFolder(name: string, parentId?: string): Promise<SecureFile> {
    await this.ensureInitialized();

    const folderId = uuidv4();
    const folder: SecureFile = {
      id: folderId,
      name,
      originalName: name,
      type: 'folder',
      size: 0,
      path: parentId ? `${parentId}/${folderId}` : `/${folderId}`,
      encrypted: false,
      checksum: '',
      version: 1,
      parentId,
      isFolder: true,
      permissions: this.createDefaultPermissions(),
      metadata: this.createDefaultMetadata(),
      versions: [],
      shares: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.executeTransaction([this.STORES.files], 'readwrite', (transaction) => {
      transaction.objectStore(this.STORES.files).add(folder);
    });

    return folder;
  }

  /**
   * List files and folders in a directory
   */
  static async listFiles(parentId?: string): Promise<SecureFile[]> {
    await this.ensureInitialized();

    return this.executeTransaction([this.STORES.files], 'readonly', (transaction) => {
      const index = transaction.objectStore(this.STORES.files).index('parentId');
      const request = index.getAll(parentId || null);
      
      return new Promise<SecureFile[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Delete a file or folder
   */
  static async deleteFile(fileId: string): Promise<void> {
    await this.ensureInitialized();

    const file = await this.getFileById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    // If it's a folder, delete all contents recursively
    if (file.isFolder) {
      const children = await this.listFiles(fileId);
      for (const child of children) {
        await this.deleteFile(child.id);
      }
    }

    // Delete file and its data
    await this.executeTransaction(
      [this.STORES.files, this.STORES.fileData, this.STORES.versions],
      'readwrite',
      (transaction) => {
        transaction.objectStore(this.STORES.files).delete(fileId);
        transaction.objectStore(this.STORES.fileData).delete(fileId);
        
        // Delete all versions
        const versionsStore = transaction.objectStore(this.STORES.versions);
        const index = versionsStore.index('fileId');
        const deleteVersions = index.openCursor(IDBKeyRange.only(fileId));
        
        deleteVersions.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
      }
    );
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<StorageStats> {
    await this.ensureInitialized();

    const files = await this.executeTransaction([this.STORES.files], 'readonly', (transaction) => {
      const request = transaction.objectStore(this.STORES.files).getAll();
      return new Promise<SecureFile[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });

    let totalSize = 0;
    let fileCount = 0;
    let folderCount = 0;

    files.forEach(file => {
      if (file.isFolder) {
        folderCount++;
      } else {
        fileCount++;
        totalSize += file.size;
      }
    });

    return {
      totalSpace: this.DEFAULT_CONFIG.storageQuota,
      usedSpace: totalSize,
      availableSpace: this.DEFAULT_CONFIG.storageQuota - totalSize,
      fileCount,
      folderCount,
    };
  }

  /**
   * Search files
   */
  static async searchFiles(query: string, filters?: { type?: string; encrypted?: boolean }): Promise<SecureFile[]> {
    await this.ensureInitialized();

    const allFiles = await this.executeTransaction([this.STORES.files], 'readonly', (transaction) => {
      const request = transaction.objectStore(this.STORES.files).getAll();
      return new Promise<SecureFile[]>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    });

    return allFiles.filter(file => {
      // Text search
      const matchesQuery = !query || 
        file.name.toLowerCase().includes(query.toLowerCase()) ||
        file.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      // Type filter
      const matchesType = !filters?.type || file.type === filters.type;

      // Encryption filter
      const matchesEncryption = filters?.encrypted === undefined || file.encrypted === filters.encrypted;

      return matchesQuery && matchesType && matchesEncryption;
    });
  }

  // Private helper methods

  private static async ensureInitialized(): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }
  }

  private static async getFileById(fileId: string): Promise<SecureFile | null> {
    return this.executeTransaction([this.STORES.files], 'readonly', (transaction) => {
      const request = transaction.objectStore(this.STORES.files).get(fileId);
      return new Promise<SecureFile | null>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    });
  }

  private static validateFile(fileData: ArrayBuffer, fileType: string): void {
    // Size validation
    if (fileData.byteLength > this.DEFAULT_CONFIG.maxFileSize) {
      throw new Error(`File too large. Maximum size: ${this.DEFAULT_CONFIG.maxFileSize} bytes`);
    }

    // Type validation
    if (this.DEFAULT_CONFIG.allowedTypes.length > 0 && !this.DEFAULT_CONFIG.allowedTypes.includes(fileType)) {
      throw new Error(`File type not allowed: ${fileType}`);
    }
  }

  private static getFileTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'txt': 'text/plain',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
    };
    return mimeTypes[extension || ''] || 'application/octet-stream';
  }

  private static createDefaultPermissions(): FilePermissions {
    return {
      owner: 'current-user', // This should be replaced with actual user ID
      viewers: [],
      editors: [],
      downloaders: [],
      public: false,
    };
  }

  private static createDefaultMetadata(): FileMetadata {
    return {
      createdBy: 'current-user', // This should be replaced with actual user ID
      lastModifiedBy: 'current-user',
      tags: [],
      customProperties: {},
    };
  }

  private static executeTransaction<T>(
    stores: string[],
    mode: IDBTransactionMode,
    operation: (transaction: IDBTransaction) => T | Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(stores, mode);
      transaction.onerror = () => reject(transaction.error);
      
      try {
        const result = operation(transaction);
        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
        } else {
          transaction.oncomplete = () => resolve(result);
        }
      } catch (error) {
        reject(error);
      }
    });
  }
}