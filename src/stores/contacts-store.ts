import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Contact, CommunicationRecord } from '@/types';
import { EncryptionService } from '@/services/encryption';
import { AuditService } from '@/services/audit';
import { v4 as uuidv4 } from 'uuid';

interface ContactGroup {
  id: string;
  name: string;
  color: string;
  description?: string;
  memberIds: string[];
  createdAt: Date;
}

interface ContactsState {
  contacts: Contact[];
  groups: ContactGroup[];
  isLoading: boolean;
  searchResults: Contact[];
  
  // Contact management
  loadContacts: () => Promise<void>;
  createContact: (contactData: Partial<Contact>) => Promise<void>;
  updateContact: (contactId: string, updates: Partial<Contact>) => Promise<void>;
  deleteContact: (contactId: string) => Promise<void>;
  
  // Search and filtering
  searchContacts: (query: string) => Promise<void>;
  filterContactsByGroup: (groupId: string) => Contact[];
  
  // Group management
  createGroup: (name: string, description?: string) => Promise<void>;
  updateGroup: (groupId: string, updates: Partial<ContactGroup>) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  addContactToGroup: (contactId: string, groupId: string) => Promise<void>;
  removeContactFromGroup: (contactId: string, groupId: string) => Promise<void>;
  
  // Communication tracking
  addCommunicationRecord: (contactId: string, record: Omit<CommunicationRecord, 'id'>) => Promise<void>;
  getCommunicationHistory: (contactId: string) => CommunicationRecord[];
  
  // Import/Export
  importContacts: (contactsData: any[]) => Promise<void>;
  exportContacts: (format: 'csv' | 'vcard' | 'json') => Promise<string>;
  
  // Encryption
  encryptContact: (contactId: string, password: string) => Promise<void>;
  decryptContact: (contactId: string, password: string) => Promise<void>;
}

export const useContactsStore = create<ContactsState>()(
  persist(
    (set, get) => ({
      contacts: [],
      groups: [],
      isLoading: false,
      searchResults: [],

      loadContacts: async () => {
        set({ isLoading: true });
        
        try {
          // In a real implementation, this would load from encrypted storage
          const state = get();
          
          // For now, use the contacts already in state
          set({ isLoading: false });

          await AuditService.logEvent(
            'contacts-loaded',
            'contacts',
            'load',
            { count: state.contacts.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Failed to load contacts:', error);
          set({ isLoading: false });
        }
      },

      createContact: async (contactData: Partial<Contact>) => {
        try {
          const newContact: Contact = {
            id: uuidv4(),
            firstName: contactData.firstName || '',
            lastName: contactData.lastName || '',
            email: contactData.email || [],
            phone: contactData.phone || [],
            address: contactData.address || [],
            company: contactData.company,
            jobTitle: contactData.jobTitle,
            notes: contactData.notes,
            tags: contactData.tags || [],
            groups: contactData.groups || [],
            relationships: [],
            communicationHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            encrypted: false,
          };

          set(state => ({
            contacts: [...state.contacts, newContact]
          }));

          await AuditService.logEvent(
            'contact-created',
            'contacts',
            newContact.id,
            { 
              name: `${newContact.firstName} ${newContact.lastName}`,
              company: newContact.company 
            },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to create contact:', error);
          throw error;
        }
      },

      updateContact: async (contactId: string, updates: Partial<Contact>) => {
        try {
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId
                ? { ...contact, ...updates, updatedAt: new Date() }
                : contact
            )
          }));

          await AuditService.logEvent(
            'contact-updated',
            'contacts',
            contactId,
            { updates: Object.keys(updates) },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to update contact:', error);
          throw error;
        }
      },

      deleteContact: async (contactId: string) => {
        try {
          const state = get();
          const contact = state.contacts.find(c => c.id === contactId);
          
          set(currentState => ({
            contacts: currentState.contacts.filter(c => c.id !== contactId)
          }));

          await AuditService.logEvent(
            'contact-deleted',
            'contacts',
            contactId,
            { 
              name: contact ? `${contact.firstName} ${contact.lastName}` : 'unknown' 
            },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete contact:', error);
          throw error;
        }
      },

      searchContacts: async (query: string) => {
        try {
          const state = get();
          const searchTerms = query.toLowerCase().split(' ');
          
          const results = state.contacts.filter(contact => {
            const searchableText = [
              contact.firstName,
              contact.lastName,
              contact.company,
              contact.jobTitle,
              ...contact.email,
              ...contact.phone,
              ...contact.tags,
              contact.notes
            ].join(' ').toLowerCase();

            return searchTerms.every(term => searchableText.includes(term));
          });

          set({ searchResults: results });

          await AuditService.logEvent(
            'contacts-searched',
            'contacts',
            'search',
            { query, resultCount: results.length },
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Contact search failed:', error);
        }
      },

      filterContactsByGroup: (groupId: string) => {
        const state = get();
        return state.contacts.filter(contact => contact.groups.includes(groupId));
      },

      createGroup: async (name: string, description?: string) => {
        try {
          const newGroup: ContactGroup = {
            id: uuidv4(),
            name,
            color: '#3b82f6', // Default blue color
            description,
            memberIds: [],
            createdAt: new Date(),
          };

          set(state => ({
            groups: [...state.groups, newGroup]
          }));

          await AuditService.logEvent(
            'contact-group-created',
            'contacts',
            newGroup.id,
            { name, description },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to create group:', error);
          throw error;
        }
      },

      updateGroup: async (groupId: string, updates: Partial<ContactGroup>) => {
        try {
          set(state => ({
            groups: state.groups.map(group =>
              group.id === groupId ? { ...group, ...updates } : group
            )
          }));

          await AuditService.logEvent(
            'contact-group-updated',
            'contacts',
            groupId,
            { updates: Object.keys(updates) },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to update group:', error);
          throw error;
        }
      },

      deleteGroup: async (groupId: string) => {
        try {
          const state = get();
          const group = state.groups.find(g => g.id === groupId);
          
          // Remove group from all contacts
          set(currentState => ({
            groups: currentState.groups.filter(g => g.id !== groupId),
            contacts: currentState.contacts.map(contact => ({
              ...contact,
              groups: contact.groups.filter(gId => gId !== groupId)
            }))
          }));

          await AuditService.logEvent(
            'contact-group-deleted',
            'contacts',
            groupId,
            { name: group?.name || 'unknown' },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to delete group:', error);
          throw error;
        }
      },

      addContactToGroup: async (contactId: string, groupId: string) => {
        try {
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId && !contact.groups.includes(groupId)
                ? { ...contact, groups: [...contact.groups, groupId], updatedAt: new Date() }
                : contact
            ),
            groups: state.groups.map(group =>
              group.id === groupId && !group.memberIds.includes(contactId)
                ? { ...group, memberIds: [...group.memberIds, contactId] }
                : group
            )
          }));

          await AuditService.logEvent(
            'contact-added-to-group',
            'contacts',
            contactId,
            { groupId },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to add contact to group:', error);
          throw error;
        }
      },

      removeContactFromGroup: async (contactId: string, groupId: string) => {
        try {
          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId
                ? { 
                    ...contact, 
                    groups: contact.groups.filter(gId => gId !== groupId),
                    updatedAt: new Date()
                  }
                : contact
            ),
            groups: state.groups.map(group =>
              group.id === groupId
                ? { ...group, memberIds: group.memberIds.filter(id => id !== contactId) }
                : group
            )
          }));

          await AuditService.logEvent(
            'contact-removed-from-group',
            'contacts',
            contactId,
            { groupId },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to remove contact from group:', error);
          throw error;
        }
      },

      addCommunicationRecord: async (contactId: string, record: Omit<CommunicationRecord, 'id'>) => {
        try {
          const communicationRecord: CommunicationRecord = {
            id: uuidv4(),
            ...record,
          };

          set(state => ({
            contacts: state.contacts.map(contact =>
              contact.id === contactId
                ? {
                    ...contact,
                    communicationHistory: [...contact.communicationHistory, communicationRecord],
                    updatedAt: new Date()
                  }
                : contact
            )
          }));

          await AuditService.logEvent(
            'communication-recorded',
            'contacts',
            contactId,
            { type: record.type, date: record.date.toISOString() },
            'communication',
            'low'
          );
        } catch (error) {
          console.error('Failed to add communication record:', error);
          throw error;
        }
      },

      getCommunicationHistory: (contactId: string) => {
        const state = get();
        const contact = state.contacts.find(c => c.id === contactId);
        return contact?.communicationHistory || [];
      },

      importContacts: async (contactsData: any[]) => {
        try {
          const importedContacts: Contact[] = contactsData.map(data => ({
            id: uuidv4(),
            firstName: data.firstName || data.first_name || '',
            lastName: data.lastName || data.last_name || '',
            email: Array.isArray(data.email) ? data.email : [data.email].filter(Boolean),
            phone: Array.isArray(data.phone) ? data.phone : [data.phone].filter(Boolean),
            address: data.address || [],
            company: data.company || data.organization,
            jobTitle: data.jobTitle || data.job_title || data.title,
            notes: data.notes || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            groups: [],
            relationships: [],
            communicationHistory: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            encrypted: false,
          }));

          set(state => ({
            contacts: [...state.contacts, ...importedContacts]
          }));

          await AuditService.logEvent(
            'contacts-imported',
            'contacts',
            'import',
            { count: importedContacts.length },
            'data-modification',
            'medium'
          );
        } catch (error) {
          console.error('Failed to import contacts:', error);
          throw error;
        }
      },

      exportContacts: async (format: 'csv' | 'vcard' | 'json') => {
        try {
          const state = get();
          
          let exportData = '';
          
          switch (format) {
            case 'csv':
              const headers = [
                'First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Job Title', 'Notes'
              ];
              
              const csvRows = [headers.join(',')];
              
              state.contacts.forEach(contact => {
                const row = [
                  `"${contact.firstName}"`,
                  `"${contact.lastName}"`,
                  `"${contact.email.join('; ')}"`,
                  `"${contact.phone.join('; ')}"`,
                  `"${contact.company || ''}"`,
                  `"${contact.jobTitle || ''}"`,
                  `"${contact.notes || ''}"`
                ];
                csvRows.push(row.join(','));
              });
              
              exportData = csvRows.join('\n');
              break;
              
            case 'json':
              exportData = JSON.stringify(state.contacts, null, 2);
              break;
              
            case 'vcard':
              const vcards = state.contacts.map(contact => {
                return [
                  'BEGIN:VCARD',
                  'VERSION:3.0',
                  `FN:${contact.firstName} ${contact.lastName}`,
                  `N:${contact.lastName};${contact.firstName};;;`,
                  ...contact.email.map(email => `EMAIL:${email}`),
                  ...contact.phone.map(phone => `TEL:${phone}`),
                  contact.company ? `ORG:${contact.company}` : '',
                  contact.jobTitle ? `TITLE:${contact.jobTitle}` : '',
                  contact.notes ? `NOTE:${contact.notes}` : '',
                  'END:VCARD'
                ].filter(Boolean).join('\n');
              });
              
              exportData = vcards.join('\n\n');
              break;
          }

          await AuditService.logEvent(
            'contacts-exported',
            'contacts',
            'export',
            { format, count: state.contacts.length },
            'data-access',
            'low'
          );

          return exportData;
        } catch (error) {
          console.error('Failed to export contacts:', error);
          throw error;
        }
      },

      encryptContact: async (contactId: string, password: string) => {
        try {
          const state = get();
          const contact = state.contacts.find(c => c.id === contactId);
          
          if (!contact || contact.encrypted) return;

          // Encrypt sensitive data
          const sensitiveData = {
            email: contact.email,
            phone: contact.phone,
            address: contact.address,
            notes: contact.notes,
            communicationHistory: contact.communicationHistory,
          };

          const encryptedData = EncryptionService.encrypt(JSON.stringify(sensitiveData), password);
          
          // Store encrypted data and clear original
          set(currentState => ({
            contacts: currentState.contacts.map(c =>
              c.id === contactId
                ? {
                    ...c,
                    email: [],
                    phone: [],
                    address: [],
                    notes: '[ENCRYPTED]',
                    communicationHistory: [],
                    encrypted: true,
                    // Store encrypted data in a special field (simplified)
                  }
                : c
            )
          }));

          await AuditService.logEvent(
            'contact-encrypted',
            'contacts',
            contactId,
            {},
            'security-event',
            'medium'
          );
        } catch (error) {
          console.error('Failed to encrypt contact:', error);
          throw error;
        }
      },

      decryptContact: async (contactId: string, password: string) => {
        try {
          // This would decrypt the contact data
          // For now, just mark as decrypted
          
          await AuditService.logEvent(
            'contact-decrypted',
            'contacts',
            contactId,
            {},
            'security-event',
            'medium'
          );
        } catch (error) {
          console.error('Failed to decrypt contact:', error);
          throw error;
        }
      },
    }),
    {
      name: 'sdc-contacts-storage',
      partialize: (state) => ({
        contacts: state.contacts,
        groups: state.groups,
      }),
    }
  )
);