import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SpreadsheetDocument, SpreadsheetSheet, SpreadsheetCell } from '../types';
import { EncryptionService } from '../services/encryption';
import { AuditService } from '../services/audit';
import { v4 as uuidv4 } from 'uuid';

interface CellPosition {
  row: number;
  col: number;
}

interface SpreadsheetState {
  documents: SpreadsheetDocument[];
  currentDocument: SpreadsheetDocument | null;
  currentSheet: SpreadsheetSheet | null;
  sheets: SpreadsheetSheet[];
  selectedCell: CellPosition | null;
  isLoading: boolean;
  
  // Document management
  createDocument: (name: string) => string;
  loadDocument: (documentId: string) => Promise<void>;
  saveDocument: () => Promise<void>;
  deleteDocument: (documentId: string) => void;
  
  // Sheet management
  addSheet: (name: string) => void;
  deleteSheet: (sheetId: string) => void;
  renameSheet: (sheetId: string, name: string) => void;
  loadSpreadsheet: (sheetId: string) => void;
  
  // Cell operations
  selectCell: (row: number, col: number) => void;
  updateCellValue: (row: number, col: number, value: any) => void;
  updateCellFormula: (row: number, col: number, formula: string) => void;
  formatCell: (row: number, col: number, format: any) => void;
  redactCell: (row: number, col: number) => void;
  lockCell: (row: number, col: number, locked: boolean) => void;
  
  // Bulk operations
  insertRow: (index: number) => void;
  insertColumn: (index: number) => void;
  deleteRow: (index: number) => void;
  deleteColumn: (index: number) => void;
  
  // Import/Export
  importFromCSV: (csvData: string) => void;
  exportToCSV: () => string;
  exportToExcel: () => Promise<Blob>;
  
  // Save/Load
  saveSpreadsheet: () => Promise<void>;
  createSheet: (name: string) => void;
}

export const useSpreadsheetStore = create<SpreadsheetState>()(
  persist(
    (set, get) => ({
      documents: [],
      currentDocument: null,
      currentSheet: null,
      sheets: [],
      selectedCell: null,
      isLoading: false,

      createDocument: (name: string) => {
        const documentId = uuidv4();
        const defaultSheet: SpreadsheetSheet = {
          id: uuidv4(),
          name: 'Sheet1',
          cells: [],
          rowCount: 100,
          colCount: 26,
          hidden: false,
          protected: false,
        };

        const document: SpreadsheetDocument = {
          id: documentId,
          name,
          sheets: [defaultSheet],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'current-user',
            lastModifiedBy: 'current-user',
            version: 1,
            size: 0,
            checksum: '',
            encrypted: true,
            tags: [],
          },
          permissions: {
            owner: 'current-user',
            readers: [],
            editors: [],
            commenters: [],
            public: false,
          },
        };

        set(state => ({
          documents: [...state.documents, document],
          currentDocument: document,
          currentSheet: defaultSheet,
          sheets: [defaultSheet],
        }));

        AuditService.logEvent(
          'spreadsheet-created',
          'spreadsheet',
          documentId,
          { name },
          'data-modification',
          'low'
        );

        return documentId;
      },

      loadDocument: async (documentId: string) => {
        set({ isLoading: true });
        
        try {
          const state = get();
          const document = state.documents.find(d => d.id === documentId);
          
          if (!document) {
            throw new Error('Document not found');
          }

          set({
            currentDocument: document,
            currentSheet: document.sheets[0] || null,
            sheets: document.sheets,
            isLoading: false,
          });

          await AuditService.logEvent(
            'spreadsheet-loaded',
            'spreadsheet',
            documentId,
            {},
            'data-access',
            'low'
          );
        } catch (error) {
          console.error('Failed to load document:', error);
          set({ isLoading: false });
        }
      },

      saveDocument: async () => {
        const state = get();
        if (!state.currentDocument) return;

        try {
          // Update metadata
          const updatedDocument = {
            ...state.currentDocument,
            sheets: state.sheets,
            metadata: {
              ...state.currentDocument.metadata,
              updatedAt: new Date(),
              lastModifiedBy: 'current-user',
              version: state.currentDocument.metadata.version + 1,
            },
          };

          set(currentState => ({
            documents: currentState.documents.map(d => 
              d.id === updatedDocument.id ? updatedDocument : d
            ),
            currentDocument: updatedDocument,
          }));

          await AuditService.logEvent(
            'spreadsheet-saved',
            'spreadsheet',
            updatedDocument.id,
            { version: updatedDocument.metadata.version },
            'data-modification',
            'low'
          );
        } catch (error) {
          console.error('Failed to save document:', error);
        }
      },

      deleteDocument: (documentId: string) => {
        set(state => ({
          documents: state.documents.filter(d => d.id !== documentId),
          currentDocument: state.currentDocument?.id === documentId ? null : state.currentDocument,
          currentSheet: state.currentDocument?.id === documentId ? null : state.currentSheet,
          sheets: state.currentDocument?.id === documentId ? [] : state.sheets,
        }));

        AuditService.logEvent(
          'spreadsheet-deleted',
          'spreadsheet',
          documentId,
          {},
          'data-modification',
          'medium'
        );
      },

      addSheet: (name: string) => {
        const newSheet: SpreadsheetSheet = {
          id: uuidv4(),
          name,
          cells: [],
          rowCount: 100,
          colCount: 26,
          hidden: false,
          protected: false,
        };

        set(state => ({
          sheets: [...state.sheets, newSheet],
          currentSheet: newSheet,
        }));

        AuditService.logEvent(
          'sheet-added',
          'spreadsheet',
          newSheet.id,
          { name },
          'data-modification',
          'low'
        );
      },

      deleteSheet: (sheetId: string) => {
        set(state => {
          const newSheets = state.sheets.filter(s => s.id !== sheetId);
          return {
            sheets: newSheets,
            currentSheet: state.currentSheet?.id === sheetId 
              ? (newSheets[0] || null) 
              : state.currentSheet,
          };
        });

        AuditService.logEvent(
          'sheet-deleted',
          'spreadsheet',
          sheetId,
          {},
          'data-modification',
          'medium'
        );
      },

      renameSheet: (sheetId: string, name: string) => {
        set(state => ({
          sheets: state.sheets.map(sheet =>
            sheet.id === sheetId ? { ...sheet, name } : sheet
          ),
          currentSheet: state.currentSheet?.id === sheetId
            ? { ...state.currentSheet, name }
            : state.currentSheet,
        }));
      },

      loadSpreadsheet: (sheetId: string) => {
        const state = get();
        const sheet = state.sheets.find(s => s.id === sheetId);
        if (sheet) {
          set({ currentSheet: sheet });
        }
      },

      selectCell: (row: number, col: number) => {
        set({ selectedCell: { row, col } });
      },

      updateCellValue: (row: number, col: number, value: any) => {
        set(state => {
          if (!state.currentSheet) return state;

          const existingCellIndex = state.currentSheet.cells.findIndex(
            c => c.row === row && c.col === col
          );

          let updatedCells = [...state.currentSheet.cells];
          
          if (existingCellIndex >= 0) {
            updatedCells[existingCellIndex] = {
              ...updatedCells[existingCellIndex],
              value,
              formula: value.toString().startsWith('=') ? value : undefined,
            };
          } else {
            const newCell: SpreadsheetCell = {
              id: uuidv4(),
              row,
              col,
              value,
              formula: value.toString().startsWith('=') ? value : undefined,
            };
            updatedCells.push(newCell);
          }

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });

        AuditService.logEvent(
          'cell-updated',
          'spreadsheet',
          get().currentSheet?.id || '',
          { row, col, value: typeof value === 'string' ? value.substring(0, 100) : value },
          'data-modification',
          'low'
        );
      },

      updateCellFormula: (row: number, col: number, formula: string) => {
        get().updateCellValue(row, col, formula);
      },

      formatCell: (row: number, col: number, format: any) => {
        set(state => {
          if (!state.currentSheet) return state;

          const existingCellIndex = state.currentSheet.cells.findIndex(
            c => c.row === row && c.col === col
          );

          let updatedCells = [...state.currentSheet.cells];
          
          if (existingCellIndex >= 0) {
            updatedCells[existingCellIndex] = {
              ...updatedCells[existingCellIndex],
              format: { ...updatedCells[existingCellIndex].format, ...format },
            };
          } else {
            const newCell: SpreadsheetCell = {
              id: uuidv4(),
              row,
              col,
              value: '',
              format,
            };
            updatedCells.push(newCell);
          }

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      redactCell: (row: number, col: number) => {
        set(state => {
          if (!state.currentSheet) return state;

          const existingCellIndex = state.currentSheet.cells.findIndex(
            c => c.row === row && c.col === col
          );

          let updatedCells = [...state.currentSheet.cells];
          
          if (existingCellIndex >= 0) {
            // Permanently remove the data
            updatedCells[existingCellIndex] = {
              ...updatedCells[existingCellIndex],
              value: '[REDACTED]',
              formula: undefined,
              redacted: true,
            };
          }

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });

        AuditService.logEvent(
          'cell-redacted',
          'spreadsheet',
          get().currentSheet?.id || '',
          { row, col },
          'security-event',
          'high'
        );
      },

      lockCell: (row: number, col: number, locked: boolean) => {
        set(state => {
          if (!state.currentSheet) return state;

          const existingCellIndex = state.currentSheet.cells.findIndex(
            c => c.row === row && c.col === col
          );

          let updatedCells = [...state.currentSheet.cells];
          
          if (existingCellIndex >= 0) {
            updatedCells[existingCellIndex] = {
              ...updatedCells[existingCellIndex],
              locked,
            };
          } else if (locked) {
            const newCell: SpreadsheetCell = {
              id: uuidv4(),
              row,
              col,
              value: '',
              locked: true,
            };
            updatedCells.push(newCell);
          }

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      insertRow: (index: number) => {
        set(state => {
          if (!state.currentSheet) return state;

          // Shift all cells down
          const updatedCells = state.currentSheet.cells.map(cell =>
            cell.row >= index ? { ...cell, row: cell.row + 1 } : cell
          );

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
            rowCount: state.currentSheet.rowCount + 1,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      insertColumn: (index: number) => {
        set(state => {
          if (!state.currentSheet) return state;

          // Shift all cells right
          const updatedCells = state.currentSheet.cells.map(cell =>
            cell.col >= index ? { ...cell, col: cell.col + 1 } : cell
          );

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
            colCount: state.currentSheet.colCount + 1,
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      deleteRow: (index: number) => {
        set(state => {
          if (!state.currentSheet) return state;

          // Remove cells in this row and shift others up
          const updatedCells = state.currentSheet.cells
            .filter(cell => cell.row !== index)
            .map(cell => 
              cell.row > index ? { ...cell, row: cell.row - 1 } : cell
            );

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
            rowCount: Math.max(1, state.currentSheet.rowCount - 1),
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      deleteColumn: (index: number) => {
        set(state => {
          if (!state.currentSheet) return state;

          // Remove cells in this column and shift others left
          const updatedCells = state.currentSheet.cells
            .filter(cell => cell.col !== index)
            .map(cell => 
              cell.col > index ? { ...cell, col: cell.col - 1 } : cell
            );

          const updatedSheet = {
            ...state.currentSheet,
            cells: updatedCells,
            colCount: Math.max(1, state.currentSheet.colCount - 1),
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });
      },

      importFromCSV: (csvData: string) => {
        const lines = csvData.split('\n');
        const cells: SpreadsheetCell[] = [];

        lines.forEach((line, row) => {
          const values = line.split(',');
          values.forEach((value, col) => {
            if (value.trim()) {
              cells.push({
                id: uuidv4(),
                row,
                col,
                value: value.trim(),
              });
            }
          });
        });

        set(state => {
          if (!state.currentSheet) return state;

          const updatedSheet = {
            ...state.currentSheet,
            cells,
            rowCount: Math.max(lines.length, state.currentSheet.rowCount),
            colCount: Math.max(
              Math.max(...lines.map(line => line.split(',').length)),
              state.currentSheet.colCount
            ),
          };

          return {
            currentSheet: updatedSheet,
            sheets: state.sheets.map(s => 
              s.id === updatedSheet.id ? updatedSheet : s
            ),
          };
        });

        AuditService.logEvent(
          'csv-imported',
          'spreadsheet',
          get().currentSheet?.id || '',
          { rows: lines.length },
          'data-modification',
          'medium'
        );
      },

      exportToCSV: () => {
        const state = get();
        if (!state.currentSheet) return '';

        const maxRow = Math.max(...state.currentSheet.cells.map(c => c.row), 0);
        const maxCol = Math.max(...state.currentSheet.cells.map(c => c.col), 0);

        const csvLines: string[] = [];

        for (let row = 0; row <= maxRow; row++) {
          const rowData: string[] = [];
          for (let col = 0; col <= maxCol; col++) {
            const cell = state.currentSheet.cells.find(c => c.row === row && c.col === col);
            const value = cell?.redacted ? '[REDACTED]' : (cell?.value?.toString() || '');
            rowData.push(`"${value.replace(/"/g, '""')}"`);
          }
          csvLines.push(rowData.join(','));
        }

        return csvLines.join('\n');
      },

      exportToExcel: async () => {
        // This would require a library like xlsx
        // For now, return a CSV blob
        const csvData = get().exportToCSV();
        return new Blob([csvData], { type: 'text/csv' });
      },

      saveSpreadsheet: async () => {
        await get().saveDocument();
      },

      createSheet: (name: string) => {
        get().addSheet(name);
      },
    }),
    {
      name: 'sdc-spreadsheet-storage',
      partialize: (state) => ({
        documents: state.documents,
        currentDocument: state.currentDocument,
        sheets: state.sheets,
        currentSheet: state.currentSheet,
      }),
    }
  )
);