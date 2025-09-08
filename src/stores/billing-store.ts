import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Invoice, Payment, CustomerDetails, InvoiceItem } from '@/types';
import { AuditService } from '@/services/audit';
import { v4 as uuidv4 } from 'uuid';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  taxId?: string;
  totalBilled: number;
  totalPaid: number;
  createdAt: Date;
}

interface FinancialSummary {
  totalReceived: number;
  totalPending: number;
  totalOverdue: number;
  totalInvoices: number;
  averageInvoiceAmount: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
}

interface BillingState {
  invoices: Invoice[];
  payments: Payment[];
  customers: Customer[];
  isLoading: boolean;
  
  // Invoice management
  loadInvoices: () => Promise<void>;
  createInvoice: (invoiceData: Partial<Invoice>) => Promise<void>;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (invoiceId: string) => Promise<void>;
  duplicateInvoice: (invoiceId: string) => Promise<void>;
  
  // Invoice actions
  sendInvoice: (invoiceId: string) => Promise<void>;
  markInvoiceAsPaid: (invoiceId: string) => Promise<void>;
  generateInvoicePDF: (invoiceId: string) => Promise<Blob>;
  
  // Payment management
  recordPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Promise<void>;
  updatePayment: (paymentId: string, updates: Partial<Payment>) => Promise<void>;
  deletePayment: (paymentId: string) => Promise<void>;
  
  // Customer management
  createCustomer: (customer: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'createdAt'>) => Promise<void>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (customerId: string) => Promise<void>;
  getCustomerInvoices: (customerId: string) => Invoice[];
  
  // Financial reporting
  getFinancialSummary: () => Promise<FinancialSummary>;
  getRevenueReport: (startDate: Date, endDate: Date) => Promise<any>;
  getTaxReport: (year: number) => Promise<any>;
  getOutstandingInvoices: () => Invoice[];
  getOverdueInvoices: () => Invoice[];
  
  // Search and filtering
  searchInvoices: (query: string) => Invoice[];
  filterInvoicesByStatus: (status: Invoice['status']) => Invoice[];
  filterInvoicesByDateRange: (startDate: Date, endDate: Date) => Invoice[];
  
  // Import/Export
  exportInvoices: (format: 'csv' | 'pdf' | 'excel') => Promise<Blob>;
  importCustomers: (customerData: any[]) => Promise<void>;
  
  // Recurring billing
  createRecurringInvoice: (invoiceId: string, frequency: 'monthly' | 'quarterly' | 'yearly') => Promise<void>;
  processRecurringInvoices: () => Promise<void>;
}

export const useBillingStore = create<BillingState>()(
  persist(
    (set, get) => ({
      invoices: [],
      payments: [],
      customers: [],
      isLoading: false,

      loadInvoices: async () => {
        set({ isLoading: true });
        
        try {
          // For demo purposes, create sample data if none exists
          const state = get();
          if (state.invoices.length === 0) {
            const sampleCustomer: Customer = {
              id: uuidv4(),
              name: 'Acme Corporation',
              email: 'billing@acme.com',
              phone: '(555) 123-4567',
              address: {
                street: '123 Business St',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'US'
              },
              totalBilled: 0,
              totalPaid: 0,
              createdAt: new Date()
            };

            const sampleInvoices: Invoice[] = [
              {
                id: uuidv4(),
                invoiceNumber: 'INV-001',
                customerId: sampleCustomer.id,
                customerDetails: {
                  name: sampleCustomer.name,
                  email: sampleCustomer.email,
                  phone: sampleCustomer.phone,
                  address: sampleCustomer.address
                },
                items: [
                  {
                    id: uuidv4(),
                    description: 'Web Development Services',
                    quantity: 40,
                    rate: 150,
                    amount: 6000,
                    taxable: true
                  },
                  {
                    id: uuidv4(),
                    description: 'UI/UX Design',
                    quantity: 20,
                    rate: 120,
                    amount: 2400,
                    taxable: true
                  }
                ],
                subtotal: 8400,
                tax: 840,
                total: 9240,
                currency: 'USD',
                status: 'sent',
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                issuedDate: new Date(),
                notes: 'Thank you for your business!',
                terms: 'Payment due within 30 days',
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: uuidv4(),
                invoiceNumber: 'INV-002',
                customerId: sampleCustomer.id,
                customerDetails: {
                  name: sampleCustomer.name,
                  email: sampleCustomer.email,
                  address: sampleCustomer.address
                },
                items: [
                  {
                    id: uuidv4(),
                    description: 'Monthly Maintenance',
                    quantity: 1,
                    rate: 500,
                    amount: 500,
                    taxable: true
                  }
                ],
                subtotal: 500,
                tax: 50,
                total: 550,
                currency: 'USD',
                status: 'paid',
                dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                issuedDate: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                paidDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
              }
            ];

            set({ 
              invoices: sampleInvoices,
              customers: [sampleCustomer]
            });
          }
          
          set({ isLoading: false });

          await AuditService.logEvent(
            'invoices-loaded',
            'billing',
            'load',
            { count: state.invoices.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Failed to load invoices:', error);
          set({ isLoading: false });
        }
      },

      createInvoice: async (invoiceData: Partial<Invoice>) => {
        try {
          const invoiceNumber = `INV-${String(get().invoices.length + 1).padStart(3, '0')}`;
          
          const items = invoiceData.items || [];
          const subtotal = items.reduce((sum: number, item: any) => sum + item.amount, 0);
          const tax = items.reduce((sum: number, item: any) => 
            sum + (item.taxable ? item.amount * 0.1 : 0), 0
          );

          const newInvoice: Invoice = {
            id: uuidv4(),
            invoiceNumber,
            customerId: invoiceData.customerId || uuidv4(),
            customerDetails: invoiceData.customerDetails!,
            items: items as InvoiceItem[],
            subtotal,
            tax,
            total: subtotal + tax,
            currency: 'USD',
            status: 'draft',
            dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            issuedDate: new Date(),
            notes: invoiceData.notes || '',
            terms: invoiceData.terms || 'Payment due within 30 days',
            createdAt: new Date(),
            updatedAt: new Date()
          };

          set(state => ({
            invoices: [newInvoice, ...state.invoices]
          }));

          await AuditService.logEvent(
            'invoice-created',
            'billing',
            newInvoice.id,
            { 
              invoiceNumber,
              customer: newInvoice.customerDetails.name,
              amount: newInvoice.total 
            },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to create invoice:', error);
          throw error;
        }
      },

      updateInvoice: async (invoiceId: string, updates: Partial<Invoice>) => {
        try {
          set(state => ({
            invoices: state.invoices.map(invoice =>
              invoice.id === invoiceId
                ? { ...invoice, ...updates, updatedAt: new Date() }
                : invoice
            )
          }));

          await AuditService.logEvent(
            'invoice-updated',
            'billing',
            invoiceId,
            { updates: Object.keys(updates) },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to update invoice:', error);
          throw error;
        }
      },

      deleteInvoice: async (invoiceId: string) => {
        try {
          const state = get();
          const invoice = state.invoices.find(i => i.id === invoiceId);
          
          set(currentState => ({
            invoices: currentState.invoices.filter(i => i.id !== invoiceId)
          }));

          await AuditService.logEvent(
            'invoice-deleted',
            'billing',
            invoiceId,
            { 
              invoiceNumber: invoice?.invoiceNumber || 'unknown',
              amount: invoice?.total || 0 
            },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete invoice:', error);
          throw error;
        }
      },

      duplicateInvoice: async (invoiceId: string) => {
        try {
          const state = get();
          const originalInvoice = state.invoices.find(i => i.id === invoiceId);
          
          if (!originalInvoice) return;

          const duplicatedInvoice: Invoice = {
            ...originalInvoice,
            id: uuidv4(),
            invoiceNumber: `INV-${String(state.invoices.length + 1).padStart(3, '0')}`,
            status: 'draft',
            issuedDate: new Date(),
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            paidDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          set(currentState => ({
            invoices: [duplicatedInvoice, ...currentState.invoices]
          }));

          await AuditService.logEvent(
            'invoice-duplicated',
            'billing',
            duplicatedInvoice.id,
            { originalInvoiceId: invoiceId },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to duplicate invoice:', error);
          throw error;
        }
      },

      sendInvoice: async (invoiceId: string) => {
        try {
          await get().updateInvoice(invoiceId, { status: 'sent' });

          await AuditService.logEvent(
            'invoice-sent',
            'billing',
            invoiceId,
            {},
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to send invoice:', error);
          throw error;
        }
      },

      markInvoiceAsPaid: async (invoiceId: string) => {
        try {
          await get().updateInvoice(invoiceId, { 
            status: 'paid',
            paidDate: new Date()
          });

          // Also record the payment
          const invoice = get().invoices.find(i => i.id === invoiceId);
          if (invoice) {
            await get().recordPayment({
              invoiceId,
              amount: invoice.total,
              currency: invoice.currency,
              method: 'bank-transfer', // Default method
              status: 'completed',
              processedAt: new Date(),
              notes: 'Marked as paid manually'
            });
          }

          await AuditService.logEvent(
            'invoice-marked-paid',
            'billing',
            invoiceId,
            {},
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to mark invoice as paid:', error);
          throw error;
        }
      },

      generateInvoicePDF: async (invoiceId: string) => {
        try {
          const invoice = get().invoices.find(i => i.id === invoiceId);
          if (!invoice) {
            throw new Error('Invoice not found');
          }

          // This would generate an actual PDF in a real implementation
          // For now, return a mock PDF blob
          const pdfContent = `Invoice ${invoice.invoiceNumber}\n\nCustomer: ${invoice.customerDetails.name}\nAmount: $${invoice.total}\nDue: ${invoice.dueDate.toLocaleDateString()}`;
          
          const blob = new Blob([pdfContent], { type: 'application/pdf' });

          await AuditService.logEvent(
            'invoice-pdf-generated',
            'billing',
            invoiceId,
            {},
            'data-access',
            'low'
          );

          return blob;
        } catch (error) {
          console.error('Failed to generate PDF:', error);
          throw error;
        }
      },

      recordPayment: async (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
        try {
          const newPayment: Payment = {
            id: uuidv4(),
            ...paymentData,
            createdAt: new Date()
          };

          set(state => ({
            payments: [newPayment, ...state.payments]
          }));

          await AuditService.logEvent(
            'payment-recorded',
            'billing',
            newPayment.invoiceId,
            { 
              amount: newPayment.amount,
              method: newPayment.method 
            },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to record payment:', error);
          throw error;
        }
      },

      updatePayment: async (paymentId: string, updates: Partial<Payment>) => {
        try {
          set(state => ({
            payments: state.payments.map(payment =>
              payment.id === paymentId ? { ...payment, ...updates } : payment
            )
          }));

          await AuditService.logEvent(
            'payment-updated',
            'billing',
            paymentId,
            { updates: Object.keys(updates) },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to update payment:', error);
          throw error;
        }
      },

      deletePayment: async (paymentId: string) => {
        try {
          set(state => ({
            payments: state.payments.filter(p => p.id !== paymentId)
          }));

          await AuditService.logEvent(
            'payment-deleted',
            'billing',
            paymentId,
            {},
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete payment:', error);
          throw error;
        }
      },

      createCustomer: async (customerData: Omit<Customer, 'id' | 'totalBilled' | 'totalPaid' | 'createdAt'>) => {
        try {
          const newCustomer: Customer = {
            id: uuidv4(),
            ...customerData,
            totalBilled: 0,
            totalPaid: 0,
            createdAt: new Date()
          };

          set(state => ({
            customers: [newCustomer, ...state.customers]
          }));

          await AuditService.logEvent(
            'customer-created',
            'billing',
            newCustomer.id,
            { name: newCustomer.name, email: newCustomer.email },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to create customer:', error);
          throw error;
        }
      },

      updateCustomer: async (customerId: string, updates: Partial<Customer>) => {
        try {
          set(state => ({
            customers: state.customers.map(customer =>
              customer.id === customerId ? { ...customer, ...updates } : customer
            )
          }));

          await AuditService.logEvent(
            'customer-updated',
            'billing',
            customerId,
            { updates: Object.keys(updates) },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to update customer:', error);
          throw error;
        }
      },

      deleteCustomer: async (customerId: string) => {
        try {
          const state = get();
          const customer = state.customers.find(c => c.id === customerId);
          
          set(currentState => ({
            customers: currentState.customers.filter(c => c.id !== customerId)
          }));

          await AuditService.logEvent(
            'customer-deleted',
            'billing',
            customerId,
            { name: customer?.name || 'unknown' },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete customer:', error);
          throw error;
        }
      },

      getCustomerInvoices: (customerId: string) => {
        const state = get();
        return state.invoices.filter(invoice => invoice.customerId === customerId);
      },

      getFinancialSummary: async () => {
        try {
          const state = get();
          
          const totalReceived = state.invoices
            .filter(inv => inv.status === 'paid')
            .reduce((sum, inv) => sum + inv.total, 0);

          const totalPending = state.invoices
            .filter(inv => inv.status === 'sent')
            .reduce((sum, inv) => sum + inv.total, 0);

          const totalOverdue = state.invoices
            .filter(inv => inv.status === 'sent' && new Date(inv.dueDate) < new Date())
            .reduce((sum, inv) => sum + inv.total, 0);

          const totalInvoices = state.invoices.length;
          const averageInvoiceAmount = totalInvoices > 0 
            ? state.invoices.reduce((sum, inv) => sum + inv.total, 0) / totalInvoices 
            : 0;

          const currentMonth = new Date();
          const monthlyRevenue = state.invoices
            .filter(inv => 
              inv.status === 'paid' && 
              inv.paidDate &&
              new Date(inv.paidDate).getMonth() === currentMonth.getMonth() &&
              new Date(inv.paidDate).getFullYear() === currentMonth.getFullYear()
            )
            .reduce((sum, inv) => sum + inv.total, 0);

          const yearlyRevenue = state.invoices
            .filter(inv => 
              inv.status === 'paid' && 
              inv.paidDate &&
              new Date(inv.paidDate).getFullYear() === currentMonth.getFullYear()
            )
            .reduce((sum, inv) => sum + inv.total, 0);

          const summary: FinancialSummary = {
            totalReceived,
            totalPending,
            totalOverdue,
            totalInvoices,
            averageInvoiceAmount,
            monthlyRevenue,
            yearlyRevenue
          };

          await AuditService.logEvent(
            'financial-summary-generated',
            'billing',
            'summary',
            summary,
            'data-access',
            'low'
          );

          return summary;
        } catch (error) {
          console.error('Failed to generate financial summary:', error);
          throw error;
        }
      },

      getRevenueReport: async (startDate: Date, endDate: Date) => {
        try {
          const state = get();
          const invoicesInRange = state.invoices.filter(inv => 
            inv.paidDate &&
            new Date(inv.paidDate) >= startDate &&
            new Date(inv.paidDate) <= endDate
          );

          const report = {
            totalRevenue: invoicesInRange.reduce((sum, inv) => sum + inv.total, 0),
            invoiceCount: invoicesInRange.length,
            averageAmount: invoicesInRange.length > 0 
              ? invoicesInRange.reduce((sum, inv) => sum + inv.total, 0) / invoicesInRange.length 
              : 0,
            invoices: invoicesInRange
          };

          await AuditService.logEvent(
            'revenue-report-generated',
            'billing',
            'report',
            { startDate, endDate, revenue: report.totalRevenue },
            'data-access',
            'low'
          );

          return report;
        } catch (error) {
          console.error('Failed to generate revenue report:', error);
          throw error;
        }
      },

      getTaxReport: async (year: number) => {
        try {
          const state = get();
          const invoicesInYear = state.invoices.filter(inv => 
            inv.paidDate &&
            new Date(inv.paidDate).getFullYear() === year
          );

          const totalTax = invoicesInYear.reduce((sum, inv) => sum + inv.tax, 0);
          const totalRevenue = invoicesInYear.reduce((sum, inv) => sum + inv.total, 0);

          const report = {
            year,
            totalTax,
            totalRevenue,
            taxableIncome: totalRevenue - totalTax,
            invoiceCount: invoicesInYear.length
          };

          await AuditService.logEvent(
            'tax-report-generated',
            'billing',
            'tax-report',
            { year, totalTax, totalRevenue },
            'data-access',
            'medium'
          );

          return report;
        } catch (error) {
          console.error('Failed to generate tax report:', error);
          throw error;
        }
      },

      getOutstandingInvoices: () => {
        const state = get();
        return state.invoices.filter(inv => inv.status === 'sent');
      },

      getOverdueInvoices: () => {
        const state = get();
        const now = new Date();
        return state.invoices.filter(inv => 
          inv.status === 'sent' && new Date(inv.dueDate) < now
        );
      },

      searchInvoices: (query: string) => {
        const state = get();
        const lowerQuery = query.toLowerCase();
        return state.invoices.filter(invoice =>
          invoice.invoiceNumber.toLowerCase().includes(lowerQuery) ||
          invoice.customerDetails.name.toLowerCase().includes(lowerQuery) ||
          invoice.customerDetails.email.toLowerCase().includes(lowerQuery) ||
          invoice.status.toLowerCase().includes(lowerQuery)
        );
      },

      filterInvoicesByStatus: (status: Invoice['status']) => {
        const state = get();
        return state.invoices.filter(inv => inv.status === status);
      },

      filterInvoicesByDateRange: (startDate: Date, endDate: Date) => {
        const state = get();
        return state.invoices.filter(inv =>
          new Date(inv.issuedDate) >= startDate &&
          new Date(inv.issuedDate) <= endDate
        );
      },

      exportInvoices: async (format: 'csv' | 'pdf' | 'excel') => {
        try {
          const state = get();
          
          if (format === 'csv') {
            const headers = [
              'Invoice Number', 'Customer', 'Amount', 'Status', 'Issue Date', 'Due Date'
            ];
            
            const csvRows = [headers.join(',')];
            
            state.invoices.forEach(invoice => {
              const row = [
                `"${invoice.invoiceNumber}"`,
                `"${invoice.customerDetails.name}"`,
                invoice.total,
                `"${invoice.status}"`,
                `"${invoice.issuedDate.toLocaleDateString()}"`,
                `"${invoice.dueDate.toLocaleDateString()}"`
              ];
              csvRows.push(row.join(','));
            });
            
            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });

            await AuditService.logEvent(
              'invoices-exported',
              'billing',
              'export',
              { format, count: state.invoices.length },
              'data-access',
              'low'
            );

            return blob;
          } else {
            // For PDF and Excel, return a placeholder blob
            const content = `Exported ${state.invoices.length} invoices in ${format} format`;
            return new Blob([content], { type: 'application/octet-stream' });
          }
        } catch (error) {
          console.error('Failed to export invoices:', error);
          throw error;
        }
      },

      importCustomers: async (customerData: any[]) => {
        try {
          const importedCustomers: Customer[] = customerData.map(data => ({
            id: uuidv4(),
            name: data.name || '',
            email: data.email || '',
            phone: data.phone,
            address: {
              street: data.address?.street || '',
              city: data.address?.city || '',
              state: data.address?.state || '',
              zip: data.address?.zip || '',
              country: data.address?.country || 'US'
            },
            taxId: data.taxId,
            totalBilled: 0,
            totalPaid: 0,
            createdAt: new Date()
          }));

          set(state => ({
            customers: [...state.customers, ...importedCustomers]
          }));

          await AuditService.logEvent(
            'customers-imported',
            'billing',
            'import',
            { count: importedCustomers.length },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to import customers:', error);
          throw error;
        }
      },

      createRecurringInvoice: async (invoiceId: string, frequency: 'monthly' | 'quarterly' | 'yearly') => {
        try {
          // This would set up recurring billing logic
          // For now, just log the action
          
          await AuditService.logEvent(
            'recurring-invoice-created',
            'billing',
            invoiceId,
            { frequency },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to create recurring invoice:', error);
          throw error;
        }
      },

      processRecurringInvoices: async () => {
        try {
          // This would process any due recurring invoices
          // For now, just log the action
          
          await AuditService.logEvent(
            'recurring-invoices-processed',
            'billing',
            'process',
            {},
            'system-configuration',
            'low'
          );
        } catch (error) {
          console.error('Failed to process recurring invoices:', error);
          throw error;
        }
      },
    }),
    {
      name: 'sdc-billing-storage',
      partialize: (state) => ({
        invoices: state.invoices,
        payments: state.payments,
        customers: state.customers,
      }),
    }
  )
);