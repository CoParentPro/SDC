/**
 * Digital Signature Service for SDC Files
 * Implements e-signature capabilities with cryptographic verification
 */

import { DigitalSignature } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export interface SignatureOptions {
  algorithm: 'RSA-PSS' | 'ECDSA';
  hashAlgorithm: 'SHA-256' | 'SHA-384' | 'SHA-512';
  keySize: 2048 | 3072 | 4096;
  includeTimestamp: boolean;
  includeCertificateChain: boolean;
}

export interface SigningResult {
  success: boolean;
  signature?: DigitalSignature;
  error?: string;
}

export interface VerificationResult {
  valid: boolean;
  details: {
    signatureValid: boolean;
    certificateValid: boolean;
    timestampValid: boolean;
    signerTrusted: boolean;
  };
  error?: string;
}

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  fingerprint: string;
}

export class ESignatureService {
  private static readonly STORAGE_KEY = 'esignature_certificates';
  private static readonly SIGNATURES_KEY = 'document_signatures';
  
  private static readonly DEFAULT_OPTIONS: SignatureOptions = {
    algorithm: 'RSA-PSS',
    hashAlgorithm: 'SHA-256',
    keySize: 2048,
    includeTimestamp: true,
    includeCertificateChain: true
  };

  /**
   * Generate a new signing certificate and key pair
   */
  static async generateCertificate(
    subjectInfo: {
      commonName: string;
      organization?: string;
      organizationalUnit?: string;
      country?: string;
      email?: string;
    },
    options: Partial<SignatureOptions> = {}
  ): Promise<{ certificate: string; privateKey: string; publicKey: string }> {
    const sigOptions = { ...this.DEFAULT_OPTIONS, ...options };
    
    try {
      // Generate key pair
      const keyPair = await crypto.subtle.generateKey(
        {
          name: sigOptions.algorithm,
          modulusLength: sigOptions.keySize,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: sigOptions.hashAlgorithm
        },
        true,
        ['sign', 'verify']
      );

      // Export keys
      const privateKey = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const publicKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);

      // Create self-signed certificate
      const certificate = await this.createSelfSignedCertificate(
        subjectInfo,
        publicKey,
        privateKey,
        sigOptions
      );

      return {
        certificate: this.arrayBufferToBase64(certificate),
        privateKey: this.arrayBufferToBase64(privateKey),
        publicKey: this.arrayBufferToBase64(publicKey)
      };
    } catch (error) {
      console.error('Failed to generate certificate:', error);
      throw new Error('Certificate generation failed');
    }
  }

  /**
   * Sign a document or data
   */
  static async signDocument(
    documentId: string,
    data: ArrayBuffer,
    signerInfo: {
      name: string;
      email: string;
      certificate: string;
      privateKey: string;
    },
    options: Partial<SignatureOptions> = {}
  ): Promise<SigningResult> {
    try {
      const sigOptions = { ...this.DEFAULT_OPTIONS, ...options };
      
      // Import private key
      const privateKeyBytes = this.base64ToArrayBuffer(signerInfo.privateKey);
      const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBytes,
        {
          name: sigOptions.algorithm,
          hash: sigOptions.hashAlgorithm
        },
        false,
        ['sign']
      );

      // Create signature data
      const signatureData = await this.createSignatureData(data, documentId, signerInfo);
      
      // Sign the data
      const signatureBytes = await crypto.subtle.sign(
        {
          name: sigOptions.algorithm,
          saltLength: sigOptions.hashAlgorithm === 'SHA-256' ? 32 : 48
        },
        cryptoKey,
        signatureData
      );

      // Create certificate chain
      const certificateChain = sigOptions.includeCertificateChain 
        ? [signerInfo.certificate]
        : [];

      // Create digital signature object
      const signature: DigitalSignature = {
        id: uuidv4(),
        documentId,
        signerId: uuidv4(),
        signerName: signerInfo.name,
        signerEmail: signerInfo.email,
        signature: this.arrayBufferToBase64(signatureBytes),
        timestamp: new Date(),
        certificateChain,
        algorithm: `${sigOptions.algorithm}-${sigOptions.hashAlgorithm}`,
        isValid: true
      };

      // Store signature
      await this.storeSignature(signature);

      return {
        success: true,
        signature
      };
    } catch (error) {
      console.error('Failed to sign document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Signing failed'
      };
    }
  }

  /**
   * Verify a digital signature
   */
  static async verifySignature(
    signature: DigitalSignature,
    documentData: ArrayBuffer
  ): Promise<VerificationResult> {
    try {
      const details = {
        signatureValid: false,
        certificateValid: false,
        timestampValid: false,
        signerTrusted: false
      };

      // Verify certificate chain
      if (signature.certificateChain.length > 0) {
        details.certificateValid = await this.verifyCertificateChain(signature.certificateChain);
      }

      // Verify timestamp (check if signature is not too old)
      const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year
      details.timestampValid = (Date.now() - signature.timestamp.getTime()) < maxAge;

      // Extract algorithm components
      const [algorithm, hashAlgorithm] = signature.algorithm.split('-') as [string, string];
      
      // Import public key from certificate
      const publicKey = await this.extractPublicKeyFromCertificate(signature.certificateChain[0]);
      
      // Create signature data
      const signatureData = await this.createSignatureData(
        documentData,
        signature.documentId,
        {
          name: signature.signerName,
          email: signature.signerEmail,
          certificate: signature.certificateChain[0],
          privateKey: '' // Not needed for verification
        }
      );

      // Verify signature
      const signatureBytes = this.base64ToArrayBuffer(signature.signature);
      details.signatureValid = await crypto.subtle.verify(
        {
          name: algorithm,
          saltLength: hashAlgorithm === 'SHA-256' ? 32 : 48
        },
        publicKey,
        signatureBytes,
        signatureData
      );

      // Check if signer is trusted (simplified - would check against CA list)
      details.signerTrusted = details.certificateValid;

      const valid = Object.values(details).every(Boolean);

      return {
        valid,
        details
      };
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return {
        valid: false,
        details: {
          signatureValid: false,
          certificateValid: false,
          timestampValid: false,
          signerTrusted: false
        },
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get all signatures for a document
   */
  static async getDocumentSignatures(documentId: string): Promise<DigitalSignature[]> {
    try {
      const stored = localStorage.getItem(this.SIGNATURES_KEY);
      if (!stored) return [];

      const signatures = JSON.parse(stored) as DigitalSignature[];
      return signatures.filter(sig => sig.documentId === documentId)
        .map(sig => ({
          ...sig,
          timestamp: new Date(sig.timestamp)
        }));
    } catch (error) {
      console.error('Failed to get document signatures:', error);
      return [];
    }
  }

  /**
   * Revoke a signature
   */
  static async revokeSignature(signatureId: string, reason: string): Promise<boolean> {
    try {
      const stored = localStorage.getItem(this.SIGNATURES_KEY);
      if (!stored) return false;

      const signatures = JSON.parse(stored) as DigitalSignature[];
      const signatureIndex = signatures.findIndex(sig => sig.id === signatureId);
      
      if (signatureIndex === -1) return false;

      signatures[signatureIndex].isValid = false;
      // In a real implementation, you would store the revocation reason and timestamp
      
      localStorage.setItem(this.SIGNATURES_KEY, JSON.stringify(signatures));
      return true;
    } catch (error) {
      console.error('Failed to revoke signature:', error);
      return false;
    }
  }

  /**
   * Create a signature visualization (for display purposes)
   */
  static async createSignatureVisualization(
    signature: DigitalSignature,
    canvasWidth = 400,
    canvasHeight = 200
  ): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // Background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Border
    ctx.strokeStyle = '#dee2e6';
    ctx.lineWidth = 2;
    ctx.strokeRect(5, 5, canvasWidth - 10, canvasHeight - 10);

    // Title
    ctx.fillStyle = '#343a40';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Digital Signature', canvasWidth / 2, 30);

    // Signer info
    ctx.font = '14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Signed by: ${signature.signerName}`, 20, 60);
    ctx.fillText(`Email: ${signature.signerEmail}`, 20, 80);
    ctx.fillText(`Date: ${signature.timestamp.toLocaleDateString()}`, 20, 100);
    ctx.fillText(`Time: ${signature.timestamp.toLocaleTimeString()}`, 20, 120);

    // Status indicator
    const statusColor = signature.isValid ? '#28a745' : '#dc3545';
    const statusText = signature.isValid ? 'Valid' : 'Invalid';
    
    ctx.fillStyle = statusColor;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(statusText, canvasWidth - 20, 60);

    // Algorithm info
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Algorithm: ${signature.algorithm}`, 20, 150);
    ctx.fillText(`ID: ${signature.id.substring(0, 8)}...`, 20, 170);

    return canvas.toDataURL('image/png');
  }

  /**
   * Export signature as PDF annotation data
   */
  static async exportSignatureForPDF(signature: DigitalSignature): Promise<any> {
    return {
      type: 'signature',
      id: signature.id,
      signer: {
        name: signature.signerName,
        email: signature.signerEmail
      },
      timestamp: signature.timestamp.toISOString(),
      algorithm: signature.algorithm,
      signature: signature.signature,
      certificate: signature.certificateChain[0],
      valid: signature.isValid
    };
  }

  // Private helper methods

  private static async createSelfSignedCertificate(
    subjectInfo: any,
    publicKey: ArrayBuffer,
    privateKey: ArrayBuffer,
    options: SignatureOptions
  ): Promise<ArrayBuffer> {
    // This is a simplified certificate creation
    // In a real implementation, you would use a proper ASN.1/X.509 library
    
    const certData = {
      version: 3,
      serialNumber: this.generateSerialNumber(),
      subject: this.createDistinguishedName(subjectInfo),
      issuer: this.createDistinguishedName(subjectInfo), // Self-signed
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      publicKey: this.arrayBufferToBase64(publicKey),
      algorithm: options.algorithm,
      hashAlgorithm: options.hashAlgorithm
    };

    return new TextEncoder().encode(JSON.stringify(certData)).buffer;
  }

  private static async createSignatureData(
    documentData: ArrayBuffer,
    documentId: string,
    signerInfo: any
  ): Promise<ArrayBuffer> {
    // Create a combined data structure for signing
    const signaturePayload = {
      documentId,
      documentHash: await this.hashData(documentData),
      signerName: signerInfo.name,
      signerEmail: signerInfo.email,
      timestamp: Date.now()
    };

    return new TextEncoder().encode(JSON.stringify(signaturePayload)).buffer;
  }

  private static async hashData(data: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  private static async verifyCertificateChain(certificates: string[]): Promise<boolean> {
    // Simplified certificate chain verification
    // In a real implementation, you would verify each certificate against its issuer
    return certificates.length > 0;
  }

  private static async extractPublicKeyFromCertificate(certificate: string): Promise<CryptoKey> {
    try {
      // Parse the simplified certificate format
      const certData = JSON.parse(new TextDecoder().decode(this.base64ToArrayBuffer(certificate)));
      const publicKeyBytes = this.base64ToArrayBuffer(certData.publicKey);
      
      return await crypto.subtle.importKey(
        'spki',
        publicKeyBytes,
        {
          name: certData.algorithm,
          hash: certData.hashAlgorithm
        },
        false,
        ['verify']
      );
    } catch (error) {
      console.error('Failed to extract public key from certificate:', error);
      throw new Error('Invalid certificate format');
    }
  }

  private static async storeSignature(signature: DigitalSignature): Promise<void> {
    try {
      const stored = localStorage.getItem(this.SIGNATURES_KEY);
      const signatures = stored ? JSON.parse(stored) : [];
      signatures.push(signature);
      localStorage.setItem(this.SIGNATURES_KEY, JSON.stringify(signatures));
    } catch (error) {
      console.error('Failed to store signature:', error);
      throw new Error('Storage failed');
    }
  }

  private static generateSerialNumber(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private static createDistinguishedName(info: any): string {
    const parts = [];
    if (info.commonName) parts.push(`CN=${info.commonName}`);
    if (info.organization) parts.push(`O=${info.organization}`);
    if (info.organizationalUnit) parts.push(`OU=${info.organizationalUnit}`);
    if (info.country) parts.push(`C=${info.country}`);
    if (info.email) parts.push(`emailAddress=${info.email}`);
    return parts.join(', ');
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

  /**
   * Parse certificate information
   */
  static parseCertificate(certificate: string): CertificateInfo | null {
    try {
      const certData = JSON.parse(new TextDecoder().decode(this.base64ToArrayBuffer(certificate)));
      
      return {
        subject: certData.subject,
        issuer: certData.issuer,
        validFrom: new Date(certData.validFrom),
        validTo: new Date(certData.validTo),
        serialNumber: certData.serialNumber,
        fingerprint: certData.serialNumber.substring(0, 16) // Simplified
      };
    } catch (error) {
      console.error('Failed to parse certificate:', error);
      return null;
    }
  }

  /**
   * Check if certificate is valid (not expired)
   */
  static isCertificateValid(certificate: string): boolean {
    const info = this.parseCertificate(certificate);
    if (!info) return false;

    const now = new Date();
    return now >= info.validFrom && now <= info.validTo;
  }
}