'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Download, 
  Trash2, 
  Search, 
  FolderPlus, 
  File, 
  Folder, 
  Lock, 
  Shield, 
  Eye,
  Key,
  Info,
  Share,
  MoreHorizontal
} from 'lucide-react';
import { useVaultStore } from '@/stores/vault-store';
import { formatBytes, formatDate } from '@/utils/format';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const SecureVaultPage = () => {
  const {
    files,
    currentFolder,
    isLoading,
    storageStats,
    loadFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    createFolder,
    navigateToFolder,
    searchFiles,
  } = useVaultStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [pendingOperation, setPendingOperation] = useState<{
    type: 'upload' | 'download' | 'view';
    file?: File;
    fileId?: string;
  } | null>(null);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingOperation({ type: 'upload', file });
    setShowPasswordDialog(true);
  }, []);

  const handlePasswordSubmit = useCallback(async () => {
    if (!pendingOperation || !currentPassword) return;

    try {
      if (pendingOperation.type === 'upload' && pendingOperation.file) {
        await uploadFile(pendingOperation.file, currentPassword, currentFolder);
      } else if (pendingOperation.type === 'download' && pendingOperation.fileId) {
        await downloadFile(pendingOperation.fileId, currentPassword);
      }
      
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setPendingOperation(null);
    } catch (error) {
      console.error('Operation failed:', error);
      // Handle error - show toast or error message
    }
  }, [pendingOperation, currentPassword, uploadFile, downloadFile, currentFolder]);

  const handleDownload = useCallback((fileId: string) => {
    setPendingOperation({ type: 'download', fileId });
    setShowPasswordDialog(true);
  }, []);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchFiles(searchQuery);
    } else {
      await loadFiles();
    }
  }, [searchQuery, searchFiles, loadFiles]);

  const handleCreateFolder = useCallback(async () => {
    const name = prompt('Enter folder name:');
    if (name) {
      await createFolder(name, currentFolder);
    }
  }, [createFolder, currentFolder]);

  const filteredFiles = files.filter(file => 
    !searchQuery || file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading secure vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Secure Vault</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Military-Grade Encryption</span>
            <Lock className="h-4 w-4 text-blue-500" />
            <span>Zero-Knowledge Storage</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleCreateFolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            New Folder
          </Button>
          
          <Button variant="outline" size="sm" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Upload File
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </Button>
        </div>
      </div>

      {/* Search and Navigation */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-md"
          />
          <Button variant="ghost" size="sm" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Storage Stats */}
        {storageStats && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>
              {storageStats.fileCount} files, {storageStats.folderCount} folders
            </span>
            <span>
              {formatBytes(storageStats.usedSpace)} / {formatBytes(storageStats.totalSpace)} used
            </span>
            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ 
                  width: `${(storageStats.usedSpace / storageStats.totalSpace) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      <div className="flex items-center p-4 text-sm text-muted-foreground border-b">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigateToFolder(undefined)}
          className="p-0 h-auto font-normal"
        >
          Root
        </Button>
        {/* Add breadcrumb logic here based on current folder path */}
      </div>

      {/* File Grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Folder className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No files or folders</p>
            <p className="text-sm">Upload your first file or create a folder to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`
                  relative group p-4 border rounded-lg cursor-pointer transition-all
                  hover:shadow-md hover:border-primary/50
                  ${selectedFiles.includes(file.id) ? 'border-primary bg-primary/5' : ''}
                `}
                onClick={() => {
                  if (file.isFolder) {
                    navigateToFolder(file.id);
                  } else {
                    // Handle file selection
                    setSelectedFiles(prev => 
                      prev.includes(file.id) 
                        ? prev.filter(id => id !== file.id)
                        : [...prev, file.id]
                    );
                  }
                }}
              >
                {/* File/Folder Icon */}
                <div className="flex flex-col items-center">
                  <div className="relative mb-2">
                    {file.isFolder ? (
                      <Folder className="h-12 w-12 text-blue-500" />
                    ) : (
                      <File className="h-12 w-12 text-gray-500" />
                    )}
                    
                    {file.encrypted && (
                      <div className="absolute -top-1 -right-1">
                        <Lock className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="text-center w-full">
                    <p className="text-sm font-medium truncate" title={file.name}>
                      {file.name}
                    </p>
                    {!file.isFolder && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatBytes(file.size)}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatDate(file.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Actions Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!file.isFolder && (
                        <>
                          <DropdownMenuItem onClick={() => handleDownload(file.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem>
                        <Info className="h-4 w-4 mr-2" />
                        Properties
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteFile(file.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Security Indicators */}
                <div className="absolute bottom-2 left-2 flex space-x-1">
                  {file.encrypted && (
                    <div className="p-1 bg-green-100 dark:bg-green-900/20 rounded">
                      <Shield className="h-3 w-3 text-green-600" />
                    </div>
                  )}
                  {file.shares.length > 0 && (
                    <div className="p-1 bg-blue-100 dark:bg-blue-900/20 rounded">
                      <Share className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Enter Encryption Password</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This password will be used to encrypt/decrypt your file. Make sure to remember it as it cannot be recovered.
            </p>
            
            <Input
              type="password"
              placeholder="Enter password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
              autoFocus
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setCurrentPassword('');
                  setPendingOperation(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordSubmit}
                disabled={!currentPassword}
              >
                Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>
            {selectedFiles.length > 0 && `${selectedFiles.length} selected`}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-green-500">End-to-End Encrypted</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3 text-blue-500" />
            <span className="text-blue-500">Zero-Knowledge</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureVaultPage;