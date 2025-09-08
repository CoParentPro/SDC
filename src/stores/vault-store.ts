import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SecureFile, StorageStats, SDCFile } from '@/types';
import { FileSystemService } from '@/services/filesystem';
import { SDCFormatService, SDCExportOptions } from '@/services/sdc-format';
import { QRCodeService } from '@/services/qr-code';
import { AuditService } from '@/services/audit';
import { EncryptionService } from '@/services/encryption';

interface VaultState {
  files: SecureFile[];
  sdcFiles: SDCFile[];
  currentFolder: string | undefined;
  isLoading: boolean;
  storageStats: StorageStats | null;
  searchResults: SecureFile[];
  isSearching: boolean;
  
  // File operations (now defaults to .sdc format)
  loadFiles: (folderId?: string) => Promise<void>;
  uploadFile: (file: File, password: string, parentId?: string) => Promise<void>;
  uploadAsSDC: (file: File, metadata: any, options: SDCExportOptions) => Promise<SDCFile>;
  downloadFile: (fileId: string, password: string) => Promise<void>;
  downloadSDCFile: (sdcFile: SDCFile, privateKey?: string, password?: string) => Promise<void>;
  deleteFile: (fileId: string) => Promise<void>;
  deleteSDCFile: (sdcFileId: string) => Promise<void>;
  
  // SDC file operations
  loadSDCFiles: () => Promise<void>;
  convertToSDC: (fileId: string, options: SDCExportOptions) => Promise<SDCFile>;
  exportSDCFile: (sdcFileId: string) => Promise<void>;
  generateQRCode: (sdcFileId: string) => Promise<string>;
  
  // Folder operations
  createFolder: (name: string, parentId?: string) => Promise<void>;
  navigateToFolder: (folderId?: string) => void;
  
  // Search
  searchFiles: (query: string) => Promise<void>;
  searchSDCFiles: (query: string) => Promise<SDCFile[]>;
  clearSearch: () => void;
  
  // File sharing
  shareFile: (fileId: string, recipientEmail: string, permissions: 'view' | 'edit' | 'download', expiresAt?: Date) => Promise<string>;
  shareSDCFile: (sdcFileId: string, generateQR?: boolean) => Promise<{ shareUrl: string; qrCode?: string }>;
  revokeShare: (shareId: string) => Promise<void>;
  
  // Storage management
  getStorageStats: () => Promise<void>;
  cleanupOldVersions: () => Promise<void>;
  
  // File versions
  getFileVersions: (fileId: string) => Promise<any[]>;
  restoreVersion: (fileId: string, versionId: string) => Promise<void>;
}

export const useVaultStore = create<VaultState>()(
  persist(
    (set, get) => ({
      files: [],
      sdcFiles: [],
      currentFolder: undefined,
      isLoading: false,
      storageStats: null,
      searchResults: [],
      isSearching: false,

      loadFiles: async (folderId?: string) => {
        set({ isLoading: true });
        
        try {
          // Initialize file system if not already done
          await FileSystemService.initialize();
          
          const files = await FileSystemService.listFiles(folderId);
          
          set({ 
            files, 
            currentFolder: folderId,
            isLoading: false 
          });

          // Update storage stats
          await get().getStorageStats();

          await AuditService.logEvent(
            'vault-accessed',
            'vault',
            folderId || 'root',
            { file_count: files.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Failed to load files:', error);
          set({ isLoading: false });
          
          await AuditService.logEvent(
            'vault-access-failed',
            'vault',
            folderId || 'root',
            { error: error instanceof Error ? error.message : 'unknown' },
            'data-access',
            'medium'
          );
        }
      },

      uploadFile: async (file: File, password: string, parentId?: string) => {
        try {
          const secureFile = await FileSystemService.storeFile(
            file,
            file.name,
            parentId,
            password
          );

          // Refresh file list
          await get().loadFiles(parentId);

          await AuditService.logEvent(
            'file-uploaded',
            'vault',
            secureFile.id,
            { 
              name: file.name,
              size: file.size,
              type: file.type,
              encrypted: true,
              parent_id: parentId 
            },
            'file-operation',
            'low'
          );
        } catch (error) {
          console.error('Failed to upload file:', error);
          
          await AuditService.logEvent(
            'file-upload-failed',
            'vault',
            file.name,
            { 
              error: error instanceof Error ? error.message : 'unknown',
              size: file.size,
              type: file.type 
            },
            'file-operation',
            'medium'
          );
          
          throw error;
        }
      },

      downloadFile: async (fileId: string, password: string) => {
        try {
          const { file, data } = await FileSystemService.retrieveFile(fileId, password);
          
          // Create download blob
          const blob = new Blob([data], { type: file.type });
          const url = URL.createObjectURL(blob);
          
          // Trigger download
          const a = document.createElement('a');
          a.href = url;
          a.download = file.originalName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          await AuditService.logEvent(
            'file-downloaded',
            'vault',
            fileId,
            { name: file.name, size: file.size },
            'file-operation',
            'low'
          );
        } catch (error) {
          console.error('Failed to download file:', error);
          
          await AuditService.logEvent(
            'file-download-failed',
            'vault',
            fileId,
            { error: error instanceof Error ? error.message : 'unknown' },
            'file-operation',
            'medium'
          );
          
          throw error;
        }
      },

      deleteFile: async (fileId: string) => {
        try {
          // Get file info before deletion for audit
          const state = get();
          const file = state.files.find(f => f.id === fileId);
          
          await FileSystemService.deleteFile(fileId);
          
          // Refresh file list
          await get().loadFiles(state.currentFolder);

          await AuditService.logEvent(
            'file-deleted',
            'vault',
            fileId,
            { 
              name: file?.name || 'unknown',
              is_folder: file?.isFolder || false 
            },
            'file-operation',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete file:', error);
          
          await AuditService.logEvent(
            'file-deletion-failed',
            'vault',
            fileId,
            { error: error instanceof Error ? error.message : 'unknown' },
            'file-operation',
            'medium'
          );
          
          throw error;
        }
      },

      createFolder: async (name: string, parentId?: string) => {
        try {
          const folder = await FileSystemService.createFolder(name, parentId);
          
          // Refresh file list
          await get().loadFiles(parentId);

          await AuditService.logEvent(
            'folder-created',
            'vault',
            folder.id,
            { name, parent_id: parentId },
            'file-operation',
            'low'
          );
        } catch (error) {
          console.error('Failed to create folder:', error);
          
          await AuditService.logEvent(
            'folder-creation-failed',
            'vault',
            name,
            { 
              error: error instanceof Error ? error.message : 'unknown',
              parent_id: parentId 
            },
            'file-operation',
            'medium'
          );
          
          throw error;
        }
      },

      navigateToFolder: (folderId?: string) => {
        get().loadFiles(folderId);
      },

      searchFiles: async (query: string) => {
        set({ isSearching: true });
        
        try {
          const results = await FileSystemService.searchFiles(query);
          
          set({ 
            searchResults: results,
            isSearching: false 
          });

          await AuditService.logEvent(
            'vault-search',
            'vault',
            'search',
            { query, result_count: results.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Search failed:', error);
          set({ isSearching: false });
        }
      },

      clearSearch: () => {
        set({ searchResults: [] });
      },

      shareFile: async (
        fileId: string, 
        recipientEmail: string, 
        permissions: 'view' | 'edit' | 'download',
        expiresAt?: Date
      ) => {
        try {
          // This would integrate with a sharing service
          // For now, generate a share ID and store locally
          
          const shareId = EncryptionService.generatePassword(16);
          const state = get();
          const file = state.files.find(f => f.id === fileId);
          
          if (!file) {
            throw new Error('File not found');
          }

          // Add share to file (simplified implementation)
          const share = {
            id: shareId,
            recipientEmail,
            permissions,
            expiresAt,
            accessCount: 0,
            createdAt: new Date(),
          };

          // In a real implementation, this would update the file in storage
          // For now, just audit the action
          
          await AuditService.logEvent(
            'file-shared',
            'vault',
            fileId,
            { 
              recipient: recipientEmail,
              permissions,
              expires_at: expiresAt?.toISOString(),
              share_id: shareId 
            },
            'file-operation',
            'low'
          );

          return shareId;
        } catch (error) {
          console.error('Failed to share file:', error);
          
          await AuditService.logEvent(
            'file-share-failed',
            'vault',
            fileId,
            { 
              error: error instanceof Error ? error.message : 'unknown',
              recipient: recipientEmail 
            },
            'file-operation',
            'medium'
          );
          
          throw error;
        }
      },

      revokeShare: async (shareId: string) => {
        try {
          // In a real implementation, this would remove the share
          
          await AuditService.logEvent(
            'file-share-revoked',
            'vault',
            shareId,
            {},
            'file-operation',
            'low'
          );
        } catch (error) {
          console.error('Failed to revoke share:', error);
          throw error;
        }
      },

      getStorageStats: async () => {
        try {
          const stats = await FileSystemService.getStorageStats();
          set({ storageStats: stats });
        } catch (error) {
          console.error('Failed to get storage stats:', error);
        }
      },

      cleanupOldVersions: async () => {
        try {
          // This would implement cleanup logic for old file versions
          // For now, just audit the action
          
          await AuditService.logEvent(
            'storage-cleanup',
            'vault',
            'cleanup',
            {},
            'system-configuration',
            'low'
          );
        } catch (error) {
          console.error('Failed to cleanup old versions:', error);
        }
      },

      getFileVersions: async (fileId: string) => {
        try {
          // This would return file version history
          // For now, return empty array
          
          await AuditService.logEvent(
            'file-versions-accessed',
            'vault',
            fileId,
            {},
            'data-access',
            'low'
          );
          
          return [];
        } catch (error) {
          console.error('Failed to get file versions:', error);
          return [];
        }
      },

      restoreVersion: async (fileId: string, versionId: string) => {
        try {
          // This would restore a specific file version
          
          await AuditService.logEvent(
            'file-version-restored',
            'vault',
            fileId,
            { version_id: versionId },
            'file-operation',
            'medium'
          );
        } catch (error) {
          console.error('Failed to restore version:', error);
          throw error;
        }
      },

      // SDC File Operations
      loadSDCFiles: async () => {
        try {
          set({ isLoading: true });
          
          const stored = localStorage.getItem('sdc_files');
          const sdcFiles = stored ? JSON.parse(stored) : [];
          
          set({ sdcFiles, isLoading: false });
          
          await AuditService.logEvent(
            'sdc-files-loaded',
            'vault',
            'all',
            { count: sdcFiles.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Failed to load SDC files:', error);
          set({ isLoading: false });
        }
      },

      uploadAsSDC: async (file: File, metadata: any, options: SDCExportOptions) => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          
          const sdcFile = await SDCFormatService.createSDCFile(
            arrayBuffer,
            file.name,
            metadata,
            options
          );
          
          const state = get();
          set({ sdcFiles: [...state.sdcFiles, sdcFile] });
          
          await AuditService.logEvent(
            'sdc-file-created',
            'vault',
            sdcFile.id,
            { 
              name: sdcFile.name,
              originalFormat: sdcFile.originalFormat,
              encrypted: sdcFile.metadata.security.encrypted,
              size: sdcFile.encryptedData.byteLength
            },
            'file-operation',
            'low'
          );
          
          return sdcFile;
        } catch (error) {
          console.error('Failed to upload as SDC:', error);
          throw error;
        }
      },

      convertToSDC: async (fileId: string, options: SDCExportOptions) => {
        try {
          const file = await FileSystemService.retrieveFile(fileId);
          if (!file) throw new Error('File not found');
          
          const fileData = await FileSystemService.retrieveFile(fileId);
          
          const sdcFile = await SDCFormatService.createSDCFile(
            fileData.data,
            file.file.name,
            {
              title: file.file.name,
              author: 'Current User',
              tags: []
            },
            options
          );
          
          const state = get();
          set({ sdcFiles: [...state.sdcFiles, sdcFile] });
          
          await AuditService.logEvent(
            'file-converted-to-sdc',
            'vault',
            fileId,
            { sdc_file_id: sdcFile.id },
            'file-operation',
            'medium'
          );
          
          return sdcFile;
        } catch (error) {
          console.error('Failed to convert to SDC:', error);
          throw error;
        }
      },

      downloadSDCFile: async (sdcFile: SDCFile, privateKey?: string, password?: string) => {
        try {
          const result = await SDCFormatService.readSDCFile(sdcFile, privateKey, password);
          
          if (result.success && result.data) {
            const blob = new Blob([result.data], { 
              type: `application/${sdcFile.originalFormat}` 
            });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = sdcFile.name.replace('.sdc', `.${sdcFile.originalFormat}`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            
            await AuditService.logEvent(
              'sdc-file-downloaded',
              'vault',
              sdcFile.id,
              { 
                name: sdcFile.name,
                views_remaining: result.viewsRemaining 
              },
              'file-operation',
              'low'
            );
          } else {
            throw new Error(result.error || 'Failed to decrypt file');
          }
        } catch (error) {
          console.error('Failed to download SDC file:', error);
          
          await AuditService.logEvent(
            'sdc-file-download-failed',
            'vault',
            sdcFile.id,
            { error: error instanceof Error ? error.message : 'unknown' },
            'file-operation',
            'high'
          );
          
          throw error;
        }
      },

      deleteSDCFile: async (sdcFileId: string) => {
        try {
          const state = get();
          const updatedFiles = state.sdcFiles.filter(f => f.id !== sdcFileId);
          set({ sdcFiles: updatedFiles });
          
          // Update localStorage
          localStorage.setItem('sdc_files', JSON.stringify(updatedFiles));
          
          await AuditService.logEvent(
            'sdc-file-deleted',
            'vault',
            sdcFileId,
            {},
            'file-operation',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete SDC file:', error);
          throw error;
        }
      },

      exportSDCFile: async (sdcFileId: string) => {
        try {
          const state = get();
          const sdcFile = state.sdcFiles.find(f => f.id === sdcFileId);
          if (!sdcFile) throw new Error('SDC file not found');
          
          const exportBlob = await SDCFormatService.exportSDCFile(sdcFile);
          const url = URL.createObjectURL(exportBlob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = sdcFile.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          await AuditService.logEvent(
            'sdc-file-exported',
            'vault',
            sdcFileId,
            { name: sdcFile.name },
            'file-operation',
            'low'
          );
        } catch (error) {
          console.error('Failed to export SDC file:', error);
          throw error;
        }
      },

      generateQRCode: async (sdcFileId: string) => {
        try {
          const state = get();
          const sdcFile = state.sdcFiles.find(f => f.id === sdcFileId);
          if (!sdcFile) throw new Error('SDC file not found');
          
          const result = await QRCodeService.generateSDCQRCode(sdcFile);
          if (!result.success) {
            throw new Error(result.error || 'QR code generation failed');
          }
          
          await AuditService.logEvent(
            'qr-code-generated',
            'vault',
            sdcFileId,
            { name: sdcFile.name },
            'file-operation',
            'low'
          );
          
          return result.qrCodeDataUrl!;
        } catch (error) {
          console.error('Failed to generate QR code:', error);
          throw error;
        }
      },

      searchSDCFiles: async (query: string) => {
        try {
          const state = get();
          const filteredFiles = state.sdcFiles.filter(file =>
            file.name.toLowerCase().includes(query.toLowerCase()) ||
            file.metadata.title.toLowerCase().includes(query.toLowerCase()) ||
            file.metadata.author.toLowerCase().includes(query.toLowerCase()) ||
            file.metadata.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
          );
          
          await AuditService.logEvent(
            'sdc-files-searched',
            'vault',
            'search',
            { query, results: filteredFiles.length },
            'data-access',
            'low'
          );
          
          return filteredFiles;
        } catch (error) {
          console.error('Failed to search SDC files:', error);
          return [];
        }
      },

      shareSDCFile: async (sdcFileId: string, generateQR: boolean = true) => {
        try {
          const state = get();
          const sdcFile = state.sdcFiles.find(f => f.id === sdcFileId);
          if (!sdcFile) throw new Error('SDC file not found');
          
          const shareUrl = `${window.location.origin}/sdc-reader?file=${sdcFile.id}&key=${encodeURIComponent(sdcFile.publicKey)}`;
          
          let qrCode: string | undefined;
          if (generateQR) {
            const qrResult = await QRCodeService.generateSDCQRCode(sdcFile);
            if (qrResult.success) {
              qrCode = qrResult.qrCodeDataUrl!;
            }
          }
          
          await AuditService.logEvent(
            'sdc-file-shared',
            'vault',
            sdcFileId,
            { 
              name: sdcFile.name,
              qr_generated: generateQR,
              share_url: shareUrl
            },
            'file-operation',
            'medium'
          );
          
          return { shareUrl, qrCode };
        } catch (error) {
          console.error('Failed to share SDC file:', error);
          throw error;
        }
      },
    }),
    {
      name: 'sdc-vault-storage',
      partialize: (state) => ({
        currentFolder: state.currentFolder,
      }),
    }
  )
);