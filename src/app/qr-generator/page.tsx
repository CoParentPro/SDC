'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  QrCode,
  Download,
  Copy,
  Share,
  BarChart3,
  Eye,
  Settings,
  Palette,
  Link2,
  FileText,
  Wifi,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Globe
} from 'lucide-react'

interface QRCodeData {
  id: string
  type: 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'location' | 'event' | 'vcard'
  content: string
  title: string
  created: string
  scans: number
  active: boolean
  style: {
    foregroundColor: string
    backgroundColor: string
    size: number
    errorCorrection: 'L' | 'M' | 'Q' | 'H'
  }
}

export default function QRGeneratorPage() {
  const [qrType, setQrType] = useState<string>('url')
  const [qrContent, setQrContent] = useState('')
  const [qrTitle, setQrTitle] = useState('')
  const [foregroundColor, setForegroundColor] = useState('#000000')
  const [backgroundColor, setBackgroundColor] = useState('#ffffff')
  const [qrSize, setQrSize] = useState(256)
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M')

  const [savedQRCodes] = useState<QRCodeData[]>([
    {
      id: '1',
      type: 'url',
      content: 'https://example.com',
      title: 'Company Website',
      created: '2024-01-15',
      scans: 1234,
      active: true,
      style: {
        foregroundColor: '#000000',
        backgroundColor: '#ffffff',
        size: 256,
        errorCorrection: 'M'
      }
    },
    {
      id: '2',
      type: 'wifi',
      content: 'WIFI:T:WPA;S:MyNetwork;P:password123;;',
      title: 'Office WiFi',
      created: '2024-01-14',
      scans: 456,
      active: true,
      style: {
        foregroundColor: '#1e40af',
        backgroundColor: '#ffffff',
        size: 256,
        errorCorrection: 'H'
      }
    },
    {
      id: '3',
      type: 'vcard',
      content: 'BEGIN:VCARD\nVERSION:3.0\nFN:John Doe\nORG:Company\nTEL:+1234567890\nEMAIL:john@example.com\nEND:VCARD',
      title: 'Business Card',
      created: '2024-01-13',
      scans: 789,
      active: false,
      style: {
        foregroundColor: '#dc2626',
        backgroundColor: '#ffffff',
        size: 256,
        errorCorrection: 'M'
      }
    }
  ])

  const qrTypes = [
    { value: 'url', label: 'Website URL', icon: Globe },
    { value: 'text', label: 'Plain Text', icon: FileText },
    { value: 'wifi', label: 'WiFi Network', icon: Wifi },
    { value: 'email', label: 'Email Address', icon: Mail },
    { value: 'phone', label: 'Phone Number', icon: Phone },
    { value: 'location', label: 'Location', icon: MapPin },
    { value: 'event', label: 'Calendar Event', icon: Calendar },
    { value: 'vcard', label: 'Contact Card', icon: CreditCard }
  ]

  const generateQRCode = () => {
    // In a real implementation, this would generate the QR code
    console.log('Generating QR code with:', {
      type: qrType,
      content: qrContent,
      title: qrTitle,
      style: {
        foregroundColor,
        backgroundColor,
        size: qrSize,
        errorCorrection
      }
    })
  }

  const getTypeIcon = (type: string) => {
    const typeConfig = qrTypes.find(t => t.value === type)
    if (typeConfig) {
      const Icon = typeConfig.icon
      return <Icon className="w-4 h-4" />
    }
    return <QrCode className="w-4 h-4" />
  }

  const renderContentInput = () => {
    switch (qrType) {
      case 'url':
        return (
          <Input
            placeholder="https://example.com"
            value={qrContent}
            onChange={(e) => setQrContent(e.target.value)}
          />
        )
      case 'wifi':
        return (
          <div className="space-y-3">
            <Input placeholder="Network Name (SSID)" />
            <Input placeholder="Password" type="password" />
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Security Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WPA">WPA/WPA2</SelectItem>
                <SelectItem value="WEP">WEP</SelectItem>
                <SelectItem value="nopass">No Password</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )
      case 'email':
        return (
          <div className="space-y-3">
            <Input placeholder="email@example.com" />
            <Input placeholder="Subject" />
            <Textarea placeholder="Message body" />
          </div>
        )
      case 'phone':
        return (
          <Input
            placeholder="+1 (555) 123-4567"
            value={qrContent}
            onChange={(e) => setQrContent(e.target.value)}
          />
        )
      case 'location':
        return (
          <div className="space-y-3">
            <Input placeholder="Latitude" />
            <Input placeholder="Longitude" />
            <Input placeholder="Location Name (optional)" />
          </div>
        )
      case 'text':
        return (
          <Textarea
            placeholder="Enter your text here..."
            value={qrContent}
            onChange={(e) => setQrContent(e.target.value)}
            className="min-h-[100px]"
          />
        )
      default:
        return (
          <Textarea
            placeholder="Enter content..."
            value={qrContent}
            onChange={(e) => setQrContent(e.target.value)}
            className="min-h-[100px]"
          />
        )
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">QR DevStudio Generator</h1>
          <p className="text-muted-foreground">
            Generate design dynamic QR codes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs defaultValue="generator" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="saved">Saved QR Codes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generator" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* QR Code Configuration */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>QR Code Content</CardTitle>
                  <CardDescription>
                    Configure what your QR code will contain
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">QR Code Title</label>
                    <Input
                      placeholder="Enter a title for this QR code"
                      value={qrTitle}
                      onChange={(e) => setQrTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Content Type</label>
                    <Select value={qrType} onValueChange={setQrType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {qrTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Content</label>
                    {renderContentInput()}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Style Customization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Foreground Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          className="w-12 h-8 rounded border"
                        />
                        <Input
                          value={foregroundColor}
                          onChange={(e) => setForegroundColor(e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Background Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          className="w-12 h-8 rounded border"
                        />
                        <Input
                          value={backgroundColor}
                          onChange={(e) => setBackgroundColor(e.target.value)}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Size: {qrSize}px</label>
                    <input
                      type="range"
                      min="128"
                      max="512"
                      step="32"
                      value={qrSize}
                      onChange={(e) => setQrSize(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Error Correction</label>
                    <Select value={errorCorrection} onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => setErrorCorrection(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Low (7%)</SelectItem>
                        <SelectItem value="M">Medium (15%)</SelectItem>
                        <SelectItem value="Q">Quartile (25%)</SelectItem>
                        <SelectItem value="H">High (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* QR Code Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Preview your QR code before generating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-checkerboard"
                      style={{ backgroundColor: backgroundColor }}
                    >
                      <div 
                        className="grid grid-cols-21 gap-px"
                        style={{ 
                          width: qrSize / 2,
                          height: qrSize / 2,
                          backgroundColor: foregroundColor
                        }}
                      >
                        {/* Mock QR Code Pattern */}
                        <div className="col-span-21 row-span-1 bg-current" />
                        <div className="col-span-7 bg-current" />
                        <div className="col-span-7" />
                        <div className="col-span-7 bg-current" />
                        {/* Add more mock pattern as needed */}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <p className="font-medium">{qrTitle || 'Untitled QR Code'}</p>
                      <p className="text-sm text-muted-foreground">
                        {qrTypes.find(t => t.value === qrType)?.label}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={generateQRCode}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Generate
                      </Button>
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Saved QR Codes</CardTitle>
              <CardDescription>
                Manage your previously created QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedQRCodes.map((qr) => (
                  <Card key={qr.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(qr.type)}
                          <span className="font-medium text-sm">{qr.title}</span>
                        </div>
                        <Badge variant={qr.active ? "default" : "secondary"}>
                          {qr.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Created: {qr.created}</p>
                        <p>Scans: {qr.scans.toLocaleString()}</p>
                        <p className="truncate">Content: {qr.content}</p>
                      </div>
                      
                      <div className="flex gap-1 mt-3">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share className="w-3 h-3 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-muted-foreground">Total QR Codes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">2,479</div>
                <p className="text-xs text-muted-foreground">Total Scans</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">2</div>
                <p className="text-xs text-muted-foreground">Active Codes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="text-2xl font-bold">826</div>
                <p className="text-xs text-muted-foreground">Avg Scans/Code</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Scan Analytics</CardTitle>
              <CardDescription>
                Performance metrics for your QR codes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savedQRCodes.map((qr) => (
                  <div key={qr.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(qr.type)}
                      <div>
                        <p className="font-medium">{qr.title}</p>
                        <p className="text-sm text-muted-foreground">{qr.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{qr.scans.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">scans</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}