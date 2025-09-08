'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  Eye,
  EyeOff,
  Shield,
  Key,
  FileText,
  QrCode,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Lock
} from 'lucide-react';
import { SDCFormatService, SDCDecryptionResult } from '@/services/sdc-format';
import { QRCodeService } from '@/services/qr-code';
import { SDCFile, SDCMetadata } from '@/types';

const SDCReaderPage = () => {
  const [sdcFile, setSdcFile] = useState<SDCFile | null>(null);
  const [decryptionResult, setDecryptionResult] = useState<SDCDecryptionResult | null>(null);
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  // Check for QR code parameters on page load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileId = urlParams.get('file');
    const publicKey = urlParams.get('key');
    
    if (fileId && publicKey) {
      loadSDCFileById(fileId, publicKey);
    }
  }, []);

  const loadSDCFileById = async (fileId: string, publicKey: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would load from a server or local storage
      const stored = localStorage.getItem('sdc_files');
      if (!stored) {
        throw new Error('No SDC files found');
      }
      
      const files = JSON.parse(stored);
      const file = files.find((f: SDCFile) => f.id === fileId);
      
      if (!file) {
        throw new Error('SDC file not found');
      }
      
      if (file.publicKey !== publicKey) {
        throw new Error('Invalid access key');
      }
      
      setSdcFile(file);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load SDC file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError(null);
      setSdcFile(null);
      setDecryptionResult(null);

      const arrayBuffer = await file.arrayBuffer();
      const importedFile = await SDCFormatService.importSDCFile(arrayBuffer);
      setSdcFile(importedFile);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load file');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!sdcFile) return;

    try {
      setIsLoading(true);
      setError(null);

      const result = await SDCFormatService.readSDCFile(
        sdcFile,
        privateKey || undefined,
        password || undefined
      );

      setDecryptionResult(result);

      if (result.success && result.data) {
        // Create blob URL for viewing
        const blob = new Blob([result.data], { 
          type: `application/${sdcFile.originalFormat}` 
        });
        const url = URL.createObjectURL(blob);
        setFileUrl(url);
      } else {
        setError(result.error || 'Decryption failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Decryption failed');
    } finally {
      setIsLoading(false);
    }
  }, [sdcFile, privateKey, password]);

  const generateQRCode = useCallback(async () => {
    if (!sdcFile) return;

    try {
      const result = await QRCodeService.generateSDCQRCode(sdcFile);
      if (result.success) {
        setQrCodeUrl(result.qrCodeDataUrl!);
      } else {
        setError(result.error || 'QR code generation failed');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'QR code generation failed');
    }
  }, [sdcFile]);

  const downloadDecryptedFile = useCallback(() => {
    if (!fileUrl || !sdcFile) return;

    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = sdcFile.name.replace('.sdc', `.${sdcFile.originalFormat}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, sdcFile]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSecurityLevel = (metadata: SDCMetadata): { level: string; color: string; icon: React.ReactNode } => {
    if (metadata.security.encrypted && metadata.security.encryptionAlgorithm === 'AES-256-GCM') {
      return {
        level: 'Military Grade',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        icon: <Shield className="h-4 w-4" />
      };
    } else if (metadata.security.encrypted) {
      return {
        level: 'Encrypted',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        icon: <Lock className="h-4 w-4" />
      };
    } else {
      return {
        level: 'Standard',
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
        icon: <FileText className="h-4 w-4" />
      };
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SDC File Reader</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Secure Data Compiler - View and decrypt .sdc files
            </p>
          </div>
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Zero-Trust Security
          </Badge>
        </div>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Load SDC File
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                      Upload SDC file or drag and drop
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      .sdc files only
                    </span>
                  </label>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".sdc"
                    className="sr-only"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" variant="destructive">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Triangle className="h-4 w-4" />
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Description>{error}</p>
          </div>
        )}

        {/* File Information */}
        {sdcFile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                File Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Name</label>
                  <p className="text-gray-900 dark:text-white">{sdcFile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Original Format</label>
                  <p className="text-gray-900 dark:text-white">.{sdcFile.originalFormat}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Title</label>
                  <p className="text-gray-900 dark:text-white">{sdcFile.metadata.title}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Author</label>
                  <p className="text-gray-900 dark:text-white">{sdcFile.metadata.author}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Created</label>
                  <p className="text-gray-900 dark:text-white">
                    {new Date(sdcFile.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">File Size</label>
                  <p className="text-gray-900 dark:text-white">
                    {formatFileSize(sdcFile.encryptedData.byteLength)}
                  </p>
                </div>
              </div>

              {/* Security Information */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">Security Profile</h3>
                  <Badge className={getSecurityLevel(sdcFile.metadata).color}>
                    <span className="flex items-center gap-1">
                      {getSecurityLevel(sdcFile.metadata).icon}
                      {getSecurityLevel(sdcFile.metadata).level}
                    </span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <span>Encryption: {sdcFile.metadata.security.encrypted ? 'AES-256-GCM' : 'None'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-gray-500" />
                    <span>Key Derivation: {sdcFile.metadata.security.keyDerivation}</span>
                  </div>
                  {sdcFile.metadata.access.expiresAt && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Expires: {new Date(sdcFile.metadata.access.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                  {sdcFile.metadata.access.maxViews && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        Views: {sdcFile.metadata.access.viewCount}/{sdcFile.metadata.access.maxViews}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {sdcFile.metadata.tags.length > 0 && (
                <div className="border-t pt-4">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {sdcFile.metadata.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Decryption Controls */}
        {sdcFile && sdcFile.metadata.security.encrypted && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                    Private Key
                  </label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={privateKey}
                      onChange={(e) => setPrivateKey(e.target.value)}
                      placeholder="Enter private key..."
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">
                    Password (Alternative)
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                  />
                </div>
              </div>
              
              <Button 
                onClick={handleDecrypt} 
                disabled={isLoading || (!privateKey && !password)}
                className="w-full"
              >
                {isLoading ? 'Decrypting...' : 'Decrypt & View File'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Non-encrypted file access */}
        {sdcFile && !sdcFile.metadata.security.encrypted && (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={handleDecrypt} disabled={isLoading} className="w-full">
                {isLoading ? 'Loading...' : 'View File'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Decryption Result */}
        {decryptionResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {decryptionResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Triangle className="h-5 w-5 text-red-600" />
                )}
                {decryptionResult.success ? 'File Decrypted Successfully' : 'Decryption Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {decryptionResult.success ? (
                <div className="space-y-4">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    <CheckCircle className="h-4 w-4" />
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Description>
                      File has been successfully decrypted and is ready for viewing.
                      {decryptionResult.viewsRemaining !== undefined && (
                        <> Views remaining: {decryptionResult.viewsRemaining}</>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={downloadDecryptedFile}>
                      <Download className="h-4 w-4 mr-2" />
                      Download Original File
                    </Button>
                    <Button variant="outline" onClick={generateQRCode}>
                      <QrCode className="h-4 w-4 mr-2" />
                      Generate QR Code
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded" variant="destructive">
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Triangle className="h-4 w-4" />
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"Description>{decryptionResult.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* QR Code Display */}
        {qrCodeUrl && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code for File Access
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                Scan this QR code to access the file on another device
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default SDCReaderPage;