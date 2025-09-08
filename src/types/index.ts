// Common types used across all features

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'viewer';
  preferences: UserPreferences;
  createdAt: Date;
  lastLogin?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sound: boolean;
  desktop: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number; // minutes
  passwordChangeRequired: boolean;
  loginNotifications: boolean;
}

// Spreadsheet types
export interface SpreadsheetCell {
  id: string;
  row: number;
  col: number;
  value: any;
  formula?: string;
  format?: CellFormat;
  locked?: boolean;
  redacted?: boolean;
}

export interface CellFormat {
  font?: {
    family?: string;
    size?: number;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    color?: string;
  };
  background?: string;
  border?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
  };
  numberFormat?: string;
}

export interface SpreadsheetSheet {
  id: string;
  name: string;
  cells: SpreadsheetCell[];
  rowCount: number;
  colCount: number;
  hidden?: boolean;
  protected?: boolean;
}

export interface SpreadsheetDocument {
  id: string;
  name: string;
  sheets: SpreadsheetSheet[];
  metadata: DocumentMetadata;
  permissions: DocumentPermissions;
}

// Document types
export interface DocumentMetadata {
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  version: number;
  size: number;
  checksum: string;
  encrypted: boolean;
  tags: string[];
}

export interface DocumentPermissions {
  owner: string;
  readers: string[];
  editors: string[];
  commenters: string[];
  public: boolean;
  expiresAt?: Date;
}

// Contact types
export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string[];
  phone: string[];
  address: Address[];
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags: string[];
  groups: string[];
  avatar?: string;
  relationships: ContactRelationship[];
  communicationHistory: CommunicationRecord[];
  createdAt: Date;
  updatedAt: Date;
  encrypted: boolean;
}

export interface Address {
  type: 'home' | 'work' | 'other';
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ContactRelationship {
  contactId: string;
  type: 'family' | 'friend' | 'colleague' | 'client' | 'vendor' | 'other';
  description?: string;
}

export interface CommunicationRecord {
  id: string;
  type: 'email' | 'phone' | 'meeting' | 'message' | 'video-call';
  date: Date;
  subject?: string;
  summary?: string;
  duration?: number; // minutes
  participants: string[];
}

// Message types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: 'text' | 'file' | 'image' | 'voice' | 'video';
  timestamp: Date;
  encrypted: boolean;
  delivered: boolean;
  read: boolean;
  edited?: boolean;
  editedAt?: Date;
  replyTo?: string;
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  encrypted: boolean;
  checksum: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  participants: string[];
  admins: string[];
  createdAt: Date;
  lastMessage?: Message;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
  encrypted: boolean;
}

// File/Vault types
export interface SecureFile {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  path: string;
  encrypted: boolean;
  checksum: string;
  version: number;
  parentId?: string; // for folder structure
  isFolder: boolean;
  permissions: FilePermissions;
  metadata: FileMetadata;
  versions: FileVersion[];
  shares: FileShare[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  createdBy: string;
  lastModifiedBy: string;
  description?: string;
  tags: string[];
  customProperties: Record<string, any>;
}

export interface FilePermissions {
  owner: string;
  viewers: string[];
  editors: string[];
  downloaders: string[];
  public: boolean;
}

export interface FileVersion {
  id: string;
  version: number;
  checksum: string;
  size: number;
  createdAt: Date;
  createdBy: string;
  changelog?: string;
}

export interface FileShare {
  id: string;
  recipientEmail: string;
  permissions: 'view' | 'edit' | 'download';
  expiresAt?: Date;
  password?: string;
  accessCount: number;
  lastAccessed?: Date;
  createdAt: Date;
}

// Audit types
export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ip: string;
  userAgent: string;
  sessionId: string;
  risk: 'low' | 'medium' | 'high' | 'critical';
  category: AuditCategory;
}

export type AuditCategory = 
  | 'authentication'
  | 'authorization'
  | 'data-access'
  | 'data-modification'
  | 'file-operation'
  | 'system-configuration'
  | 'security-event'
  | 'communication'
  | 'content-creation';

// Billing types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerDetails: CustomerDetails;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  notes?: string;
  terms?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone?: string;
  address: Address;
  taxId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxable: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'check' | 'credit-card' | 'bank-transfer' | 'crypto';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  transactionId?: string;
  processedAt?: Date;
  notes?: string;
  createdAt: Date;
}

// Video Chat types
export interface VideoCall {
  id: string;
  title: string;
  participants: CallParticipant[];
  startTime: Date;
  endTime?: Date;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
  isRecording: boolean;
  recordingUrl?: string;
  transcription?: CallTranscription[];
  settings: CallSettings;
  chatMessages: CallMessage[];
}

export interface CallParticipant {
  userId: string;
  name: string;
  email: string;
  role: 'host' | 'presenter' | 'participant';
  isConnected: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export interface CallSettings {
  allowChat: boolean;
  allowScreenShare: boolean;
  allowRecording: boolean;
  requirePermissionToJoin: boolean;
  enableTranscription: boolean;
  enableTranslation: boolean;
  targetLanguage?: string;
}

export interface CallTranscription {
  id: string;
  speakerId: string;
  speakerName: string;
  text: string;
  confidence: number;
  timestamp: Date;
  language: string;
  translation?: string;
}

export interface CallMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: Date;
  isPrivate: boolean;
  recipientId?: string;
}

// Image Editor types
export interface ImageProject {
  id: string;
  name: string;
  width: number;
  height: number;
  layers: ImageLayer[];
  history: ImageHistoryStep[];
  currentHistoryIndex: number;
  metadata: DocumentMetadata;
}

export interface ImageLayer {
  id: string;
  name: string;
  type: 'image' | 'text' | 'shape' | 'adjustment';
  visible: boolean;
  opacity: number;
  blendMode: string;
  x: number;
  y: number;
  width: number;
  height: number;
  data: any; // layer-specific data
  filters: ImageFilter[];
}

export interface ImageFilter {
  type: string;
  parameters: Record<string, any>;
}

export interface ImageHistoryStep {
  id: string;
  action: string;
  timestamp: Date;
  layersSnapshot: string; // serialized layers
}

// Common UI types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  details?: any;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SearchState {
  query: string;
  filters: Record<string, any>;
  results: any[];
  totalResults: number;
  isSearching: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ComponentType;
}

// Video Editor types
export interface VideoProject {
  id: string;
  name: string;
  duration: number;
  fps: number;
  resolution: string;
  hasMedia: boolean;
  tracks: VideoTrack[];
  media: VideoMedia[];
  metadata: DocumentMetadata;
  permissions: DocumentPermissions;
  exportSettings: VideoExportSettings;
}

export interface VideoTrack {
  id: string;
  type: 'video' | 'audio' | 'subtitle';
  name: string;
  clips: VideoClip[];
  muted: boolean;
  locked: boolean;
  visible: boolean;
  height: number;
}

export interface VideoClip {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  trimStart: number;
  trimEnd: number;
  volume: number;
  effects: VideoEffect[];
  redactionMasks: RedactionMask[];
  mediaId?: string;
}

export interface VideoMedia {
  id: string;
  name: string;
  type: 'video' | 'audio';
  url: string;
  duration: number;
  size: number;
  format: string;
  resolution?: string;
  fps?: number;
}

export interface VideoEffect {
  id: string;
  type: 'filter' | 'transition' | 'text' | 'overlay';
  name: string;
  properties: Record<string, any>;
  startTime: number;
  duration: number;
}

export interface RedactionMask {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  startFrame: number;
  endFrame: number;
  type: 'blur' | 'black' | 'pixelate';
}

export interface VideoExportSettings {
  format: 'mp4' | 'avi' | 'mov' | 'webm';
  quality: 'low' | 'medium' | 'high';
  resolution: string;
  fps: number;
  bitrate: number;
}

// Creation Studio types
export interface Presentation {
  id: string;
  name: string;
  slides: Slide[];
  theme: PresentationTheme;
  settings: PresentationSettings;
  metadata: DocumentMetadata;
  permissions: DocumentPermissions;
}

export interface Slide {
  id: string;
  title: string;
  content: SlideContent[];
  background: SlideBackground;
  transitions: SlideTransition[];
  animations: SlideAnimation[];
  notes: string;
  duration?: number;
}

export interface SlideContent {
  id: string;
  type: 'text' | 'image' | 'video' | 'audio' | 'chart' | 'table' | 'quiz' | 'button';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  data: any;
  animations: ContentAnimation[];
}

export interface SlideBackground {
  type: 'color' | 'gradient' | 'image' | 'video';
  value: string;
  overlay?: {
    color: string;
    opacity: number;
  };
}

export interface SlideTransition {
  type: string;
  duration: number;
  direction?: string;
  easing?: string;
}

export interface SlideAnimation {
  id: string;
  type: string;
  target: string; // element id
  duration: number;
  delay: number;
  easing: string;
  properties: Record<string, any>;
}

export interface ContentAnimation {
  id: string;
  type: 'entrance' | 'emphasis' | 'exit';
  effect: string;
  duration: number;
  delay: number;
  trigger: 'auto' | 'click' | 'hover';
}

export interface PresentationTheme {
  id: string;
  name: string;
  fonts: {
    heading: string;
    body: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
}

export interface PresentationSettings {
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  showControls: boolean;
  allowDownload: boolean;
  enableComments: boolean;
  enableAnalytics: boolean;
  password?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  modules: CourseModule[];
  settings: CourseSettings;
  metadata: DocumentMetadata;
  permissions: DocumentPermissions;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  assessments: Assessment[];
  order: number;
  unlockCriteria?: UnlockCriteria;
}

export interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'text' | 'presentation' | 'interactive';
  content: any;
  duration: number;
  order: number;
  resources: LessonResource[];
}

export interface LessonResource {
  id: string;
  name: string;
  type: 'pdf' | 'video' | 'audio' | 'link' | 'file';
  url: string;
  size?: number;
  downloadable: boolean;
}

export interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'assignment' | 'project';
  questions: AssessmentQuestion[];
  timeLimit?: number;
  attempts: number;
  passingScore: number;
  randomize: boolean;
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'essay' | 'fill-blank' | 'matching';
  question: string;
  options?: string[];
  correctAnswer: any;
  points: number;
  explanation?: string;
}

export interface UnlockCriteria {
  type: 'completion' | 'score' | 'time' | 'date';
  value: any;
  moduleIds?: string[];
  lessonIds?: string[];
}

export interface CourseSettings {
  isPublic: boolean;
  enrollmentRequired: boolean;
  certificate: boolean;
  trackProgress: boolean;
  allowDiscussions: boolean;
  price?: number;
  currency?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: PaginationState;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Storage and Vault types
export interface StorageStats {
  totalSpace: number;
  usedSpace: number;
  freeSpace: number;
  fileCount: number;
  folderCount: number;
  lastUpdated: Date;
}

// SDC File format types (new secure format)
export interface SDCFile {
  id: string;
  name: string;
  originalFormat: string;
  encryptedData: ArrayBuffer;
  publicKey: string;
  privateKeyHash: string;
  metadata: SDCMetadata;
  signature: string;
  createdAt: Date;
  lastModified: Date;
}

export interface SDCMetadata {
  title: string;
  description?: string;
  author: string;
  version: string;
  tags: string[];
  security: {
    encrypted: boolean;
    compressionAlgorithm: string;
    encryptionAlgorithm: string;
    keyDerivation: string;
  };
  access: {
    requiresKey: boolean;
    expiresAt?: Date;
    maxViews?: number;
    viewCount: number;
  };
}

// QR Code types for SDC files
export interface SDCQRCode {
  fileId: string;
  publicKey: string;
  accessUrl: string;
  qrCodeData: string;
  expiresAt?: Date;
  maxUses?: number;
  useCount: number;
}

// E-signature types
export interface DigitalSignature {
  id: string;
  documentId: string;
  signerId: string;
  signerName: string;
  signerEmail: string;
  signature: string; // Base64 encoded signature
  timestamp: Date;
  certificateChain: string[];
  algorithm: string;
  isValid: boolean;
}

// Image filter types (fixing missing id property)
export interface ImageFilter {
  id: string;
  name: string;
  type: string;
  settings: Record<string, any>;
  intensity?: number;
}