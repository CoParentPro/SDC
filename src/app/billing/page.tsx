'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Search, 
  Download, 
  Send, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Calendar, 
  TrendingUp,
  Shield,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Copy
} from 'lucide-react';
import { useBillingStore } from '@/stores/billing-store';
import { formatCurrency, formatDate } from '@/utils/format';
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

const BillingPage = () => {
  const {
    invoices,
    payments,
    customers,
    isLoading,
    loadInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    sendInvoice,
    recordPayment,
    getFinancialSummary,
  } = useBillingStore();

  const [activeTab, setActiveTab] = useState('invoices');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const [newInvoice, setNewInvoice] = useState({
    customerDetails: {
      name: '',
      email: '',
      address: {
        type: 'work' as const,
        street: '',
        city: '',
        state: '',
        zip: '',
        country: 'US'
      }
    },
    items: [
      {
        id: '',
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0,
        taxable: true
      }
    ],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    terms: 'Payment due within 30 days'
  });

  const [financialSummary, setFinancialSummary] = useState<any>(null);

  useEffect(() => {
    loadInvoices();
    getFinancialSummary().then(setFinancialSummary);
  }, [loadInvoices, getFinancialSummary]);

  const handleCreateInvoice = useCallback(async () => {
    try {
      await createInvoice(newInvoice);
      setIsCreateInvoiceOpen(false);
      setNewInvoice({
        customerDetails: {
          name: '',
          email: '',
          address: {
            type: 'work' as const,
            street: '',
            city: '',
            state: '',
            zip: '',
            country: 'US'
          }
        },
        items: [
          {
            id: '',
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            taxable: true
          }
        ],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        notes: '',
        terms: 'Payment due within 30 days'
      });
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  }, [createInvoice, newInvoice]);

  const addInvoiceItem = useCallback(() => {
    setNewInvoice(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: '',
          description: '',
          quantity: 1,
          rate: 0,
          amount: 0,
          taxable: true
        }
      ]
    }));
  }, []);

  const updateInvoiceItem = useCallback((index: number, field: string, value: any) => {
    setNewInvoice(prev => {
      const updatedItems = [...prev.items];
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
        amount: field === 'quantity' || field === 'rate' 
          ? (field === 'quantity' ? value : updatedItems[index].quantity) * 
            (field === 'rate' ? value : updatedItems[index].rate)
          : updatedItems[index].amount
      };
      return { ...prev, items: updatedItems };
    });
  }, []);

  const removeInvoiceItem = useCallback((index: number) => {
    setNewInvoice(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  }, []);

  const calculateTotal = useCallback((items: any[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = items.reduce((sum, item) => sum + (item.taxable ? item.amount * 0.1 : 0), 0); // 10% tax
    return {
      subtotal,
      tax,
      total: subtotal + tax
    };
  }, []);

  const filteredInvoices = invoices.filter(invoice => 
    !searchQuery || 
    invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <DollarSign className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading billing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Billing & Invoicing</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Secure Payments</span>
            <Shield className="h-4 w-4 text-blue-500" />
            <span>Encrypted Data</span>
          </div>
        </div>
        
        <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Customer Name"
                    value={newInvoice.customerDetails.name}
                    onChange={(e) => setNewInvoice(prev => ({
                      ...prev,
                      customerDetails: { ...prev.customerDetails, name: e.target.value }
                    }))}
                  />
                  <Input
                    type="email"
                    placeholder="Email Address"
                    value={newInvoice.customerDetails.email}
                    onChange={(e) => setNewInvoice(prev => ({
                      ...prev,
                      customerDetails: { ...prev.customerDetails, email: e.target.value }
                    }))}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <Input
                    placeholder="Street Address"
                    value={newInvoice.customerDetails.address.street}
                    onChange={(e) => setNewInvoice(prev => ({
                      ...prev,
                      customerDetails: {
                        ...prev.customerDetails,
                        address: { ...prev.customerDetails.address, street: e.target.value }
                      }
                    }))}
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="City"
                      value={newInvoice.customerDetails.address.city}
                      onChange={(e) => setNewInvoice(prev => ({
                        ...prev,
                        customerDetails: {
                          ...prev.customerDetails,
                          address: { ...prev.customerDetails.address, city: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="State"
                      value={newInvoice.customerDetails.address.state}
                      onChange={(e) => setNewInvoice(prev => ({
                        ...prev,
                        customerDetails: {
                          ...prev.customerDetails,
                          address: { ...prev.customerDetails.address, state: e.target.value }
                        }
                      }))}
                    />
                    <Input
                      placeholder="ZIP"
                      value={newInvoice.customerDetails.address.zip}
                      onChange={(e) => setNewInvoice(prev => ({
                        ...prev,
                        customerDetails: {
                          ...prev.customerDetails,
                          address: { ...prev.customerDetails.address, zip: e.target.value }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">Invoice Items</h3>
                  <Button variant="outline" size="sm" onClick={addInvoiceItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {newInvoice.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateInvoiceItem(index, 'quantity', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateInvoiceItem(index, 'rate', Number(e.target.value))}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          readOnly
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeInvoiceItem(index)}
                          disabled={newInvoice.items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="mt-4 space-y-2 text-right">
                  {(() => {
                    const totals = calculateTotal(newInvoice.items);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (10%):</span>
                          <span>{formatCurrency(totals.tax)}</span>
                        </div>
                        <div className="flex justify-between font-semibold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(totals.total)}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Invoice Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Due Date</label>
                  <Input
                    type="date"
                    value={newInvoice.dueDate.toISOString().split('T')[0]}
                    onChange={(e) => setNewInvoice(prev => ({
                      ...prev,
                      dueDate: new Date(e.target.value)
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Terms</label>
                  <Input
                    placeholder="Payment terms"
                    value={newInvoice.terms}
                    onChange={(e) => setNewInvoice(prev => ({ ...prev, terms: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <Input
                  placeholder="Additional notes"
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvoice} disabled={!newInvoice.customerDetails.name}>
                  Create Invoice
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Financial Summary */}
      {financialSummary && (
        <div className="p-4 border-b bg-muted/30">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary.totalReceived)}
              </div>
              <div className="text-sm text-muted-foreground">Total Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(financialSummary.totalPending)}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(financialSummary.totalOverdue)}
              </div>
              <div className="text-sm text-muted-foreground">Overdue</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {financialSummary.totalInvoices}
              </div>
              <div className="text-sm text-muted-foreground">Total Invoices</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="p-4 border-b">
            <TabsList>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="invoices" className="flex-1 overflow-auto p-4">
            {/* Search */}
            <div className="flex items-center space-x-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Invoices Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Invoice #</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Due Date</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-t hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{invoice.invoiceNumber}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(invoice.issuedDate)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{invoice.customerDetails.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {invoice.customerDetails.email}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{formatCurrency(invoice.total)}</div>
                      </td>
                      <td className="p-3">
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                          ${invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' : ''}
                          ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                          ${invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {invoice.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className={`
                          ${new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' 
                            ? 'text-red-600 font-medium' 
                            : ''
                          }
                        `}>
                          {formatDate(invoice.dueDate)}
                        </div>
                      </td>
                      <td className="p-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => sendInvoice(invoice.id)}>
                              <Send className="h-4 w-4 mr-2" />
                              Send
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Download className="h-4 w-4 mr-2" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => deleteInvoice(invoice.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="flex-1 overflow-auto p-4">
            <div className="text-center text-muted-foreground">
              <CreditCard className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Payment Tracking</h3>
              <p>Record and track all incoming payments</p>
            </div>
          </TabsContent>

          <TabsContent value="customers" className="flex-1 overflow-auto p-4">
            <div className="text-center text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
              <p>Manage customer information and billing history</p>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="flex-1 overflow-auto p-4">
            <div className="text-center text-muted-foreground">
              <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Financial Reports</h3>
              <p>Generate comprehensive financial reports and analytics</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>{filteredInvoices.length} invoices</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-green-500">PCI Compliant</span>
          </div>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-blue-500" />
            <span className="text-blue-500">Secure Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;