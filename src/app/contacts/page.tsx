'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Users, 
  Shield, 
  Lock,
  MoreHorizontal,
  Edit,
  Trash2,
  MessageCircle,
  Video
} from 'lucide-react';
import { useContactsStore } from '../../../stores/contacts-store';
import { formatPhoneNumber, getInitials, stringToColor } from '../../../utils/format';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';

const ContactsPage = () => {
  const {
    contacts,
    groups,
    isLoading,
    loadContacts,
    createContact,
    updateContact,
    deleteContact,
    searchContacts,
    createGroup,
  } = useContactsStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);

  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    email: [''],
    phone: [''],
    company: '',
    jobTitle: '',
    notes: '',
    tags: [] as string[],
    groups: [] as string[],
  });

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim()) {
      await searchContacts(searchQuery);
    } else {
      await loadContacts();
    }
  }, [searchQuery, searchContacts, loadContacts]);

  const handleCreateContact = useCallback(async () => {
    try {
      await createContact(newContact);
      setIsCreateDialogOpen(false);
      setNewContact({
        firstName: '',
        lastName: '',
        email: [''],
        phone: [''],
        company: '',
        jobTitle: '',
        notes: '',
        tags: [],
        groups: [],
      });
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  }, [createContact, newContact]);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchQuery || 
      `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.some(email => email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGroup = selectedGroup === 'all' || contact.groups.includes(selectedGroup);

    return matchesSearch && matchesGroup;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading contacts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>End-to-End Encrypted</span>
            <Lock className="h-4 w-4 text-blue-500" />
            <span>Secure Storage</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => createGroup('New Group')}>
            <Users className="h-4 w-4 mr-2" />
            New Group
          </Button>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="First Name"
                    value={newContact.firstName}
                    onChange={(e) => setNewContact(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                  <Input
                    placeholder="Last Name"
                    value={newContact.lastName}
                    onChange={(e) => setNewContact(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                
                <Input
                  type="email"
                  placeholder="Email"
                  value={newContact.email[0]}
                  onChange={(e) => setNewContact(prev => ({ 
                    ...prev, 
                    email: [e.target.value, ...prev.email.slice(1)] 
                  }))}
                />
                
                <Input
                  type="tel"
                  placeholder="Phone"
                  value={newContact.phone[0]}
                  onChange={(e) => setNewContact(prev => ({ 
                    ...prev, 
                    phone: [e.target.value, ...prev.phone.slice(1)] 
                  }))}
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Company"
                    value={newContact.company}
                    onChange={(e) => setNewContact(prev => ({ ...prev, company: e.target.value }))}
                  />
                  <Input
                    placeholder="Job Title"
                    value={newContact.jobTitle}
                    onChange={(e) => setNewContact(prev => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateContact}
                    disabled={!newContact.firstName || !newContact.lastName}
                  >
                    Create Contact
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2 flex-1">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="max-w-md"
          />
          <Button variant="ghost" size="sm" onClick={handleSearch}>
            Search
          </Button>
        </div>

        {/* Group Filter */}
        <div className="flex items-center space-x-2">
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="px-3 py-1 border rounded-md bg-background"
          >
            <option value="all">All Contacts</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          
          <span className="text-sm text-muted-foreground">
            {filteredContacts.length} contacts
          </span>
        </div>
      </div>

      {/* Contacts Grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Users className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-lg mb-2">No contacts found</p>
            <p className="text-sm">Add your first contact to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContacts.map((contact) => (
              <div
                key={contact.id}
                className="relative group p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
              >
                {/* Contact Avatar and Name */}
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: stringToColor(`${contact.firstName} ${contact.lastName}`) }}
                  >
                    {getInitials(`${contact.firstName} ${contact.lastName}`)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {contact.firstName} {contact.lastName}
                    </h3>
                    {contact.jobTitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {contact.jobTitle}
                      </p>
                    )}
                    {contact.company && (
                      <div className="flex items-center mt-1">
                        <Building className="h-3 w-3 mr-1 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">
                          {contact.company}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-3 space-y-2">
                  {contact.email[0] && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-xs truncate">{contact.email[0]}</span>
                    </div>
                  )}
                  
                  {contact.phone[0] && (
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-2 text-muted-foreground" />
                      <span className="text-xs">{formatPhoneNumber(contact.phone[0])}</span>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="mt-3 flex justify-between items-center">
                  <div className="flex space-x-1">
                    {contact.email[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Send Email"
                      >
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                    
                    {contact.phone[0] && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Call"
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Message"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      title="Video Call"
                    >
                      <Video className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* More Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingContact(contact)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => deleteContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Tags */}
                {contact.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                    {contact.tags.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md">
                        +{contact.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Security Indicator */}
                {contact.encrypted && (
                  <div className="absolute top-2 right-2">
                    <Shield className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>
            {filteredContacts.length} of {contacts.length} contacts
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Encrypted Storage</span>
          </div>
          <div className="flex items-center space-x-1">
            <Lock className="h-3 w-3 text-blue-500" />
            <span className="text-blue-500">Privacy Protected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactsPage;