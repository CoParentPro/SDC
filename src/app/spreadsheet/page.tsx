'use client';

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calculator, 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff,
  FileText,
  Lock,
  Shield
} from 'lucide-react';
import { useSpreadsheetStore } from '@/stores/spreadsheet-store';
import { FormulaEngine } from '@/services/formula-engine';

interface CellPosition {
  row: number;
  col: number;
}

const SpreadsheetPage = () => {
  const {
    currentSheet,
    sheets,
    selectedCell,
    isLoading,
    loadSpreadsheet,
    createSheet,
    createDocument,
    selectCell,
    updateCellValue,
    addSheet,
    deleteSheet,
    saveSpreadsheet,
  } = useSpreadsheetStore();

  const [formulaInput, setFormulaInput] = useState('');
  const [isEditingFormula, setIsEditingFormula] = useState(false);

  // Initialize with default document if none exists
  useEffect(() => {
    if (!currentSheet && sheets.length === 0) {
      createDocument('New Spreadsheet');
    }
  }, [currentSheet, sheets, createDocument]);

  useEffect(() => {
    if (selectedCell && currentSheet) {
      const cell = currentSheet.cells.find(
        c => c.row === selectedCell.row && c.col === selectedCell.col
      );
      setFormulaInput(cell?.formula || cell?.value?.toString() || '');
    }
  }, [selectedCell, currentSheet]);

  const handleCellClick = useCallback((row: number, col: number) => {
    selectCell(row, col);
  }, [selectCell]);

  const handleFormulaSubmit = useCallback(() => {
    if (selectedCell && formulaInput) {
      updateCellValue(selectedCell.row, selectedCell.col, formulaInput);
      setIsEditingFormula(false);
    }
  }, [selectedCell, formulaInput, updateCellValue]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFormulaSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingFormula(false);
      if (selectedCell && currentSheet) {
        const cell = currentSheet.cells.find(
          c => c.row === selectedCell.row && c.col === selectedCell.col
        );
        setFormulaInput(cell?.formula || cell?.value?.toString() || '');
      }
    }
  }, [handleFormulaSubmit, selectedCell, currentSheet]);

  const getCellValue = useCallback((row: number, col: number) => {
    if (!currentSheet) return '';
    
    const cell = currentSheet.cells.find(c => c.row === row && c.col === col);
    if (!cell) return '';

    if (cell.formula) {
      try {
        return FormulaEngine.evaluate(cell.formula, currentSheet.cells);
      } catch (error) {
        return '#ERROR';
      }
    }

    return cell.value?.toString() || '';
  }, [currentSheet]);

  const getColumnLabel = useCallback((col: number) => {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Calculator className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Spreadsheet Editor</h1>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-500" />
            <span>AES-256 Encrypted</span>
            <Lock className="h-4 w-4 text-blue-500" />
            <span>Local Storage Only</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => saveSpreadsheet()}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="flex items-center p-2 border-b bg-muted/30">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <span className="text-sm font-medium min-w-fit">
            {selectedCell ? `${getColumnLabel(selectedCell.col)}${selectedCell.row + 1}` : 'A1'}
          </span>
          <Input
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            onFocus={() => setIsEditingFormula(true)}
            onBlur={handleFormulaSubmit}
            onKeyDown={handleKeyDown}
            placeholder="Enter value or formula (=SUM(A1:A10))"
            className="flex-1"
          />
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="border-b">
        <Tabs value={currentSheet?.id} className="w-full">
          <div className="flex items-center justify-between px-4">
            <TabsList className="h-auto p-0 bg-transparent">
              {sheets.map((sheet) => (
                <TabsTrigger
                  key={sheet.id}
                  value={sheet.id}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  onClick={() => loadSpreadsheet(sheet.id)}
                >
                  <div className="flex items-center space-x-2">
                    <span>{sheet.name}</span>
                    {sheet.protected && <Lock className="h-3 w-3" />}
                    {sheet.hidden && <EyeOff className="h-3 w-3" />}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addSheet(`Sheet ${sheets.length + 1}`)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto">
        {currentSheet && (
          <div className="relative">
            {/* Grid */}
            <div className="grid" style={{ 
              gridTemplateColumns: `40px repeat(${currentSheet.colCount}, 120px)`,
              gridTemplateRows: `30px repeat(${currentSheet.rowCount}, 30px)`
            }}>
              {/* Corner cell */}
              <div className="bg-muted border border-border flex items-center justify-center text-xs font-medium">
                
              </div>
              
              {/* Column headers */}
              {Array.from({ length: currentSheet.colCount }, (_, col) => (
                <div
                  key={`col-${col}`}
                  className="bg-muted border border-border flex items-center justify-center text-xs font-medium"
                >
                  {getColumnLabel(col)}
                </div>
              ))}

              {/* Rows */}
              {Array.from({ length: currentSheet.rowCount }, (_, row) => (
                <>
                  {/* Row header */}
                  <div
                    key={`row-${row}`}
                    className="bg-muted border border-border flex items-center justify-center text-xs font-medium"
                  >
                    {row + 1}
                  </div>
                  
                  {/* Row cells */}
                  {Array.from({ length: currentSheet.colCount }, (_, col) => {
                    const isSelected = selectedCell?.row === row && selectedCell?.col === col;
                    const cell = currentSheet.cells.find(c => c.row === row && c.col === col);
                    
                    return (
                      <div
                        key={`cell-${row}-${col}`}
                        className={`
                          border border-border cursor-cell text-sm relative
                          ${isSelected ? 'ring-2 ring-primary bg-primary/10' : 'hover:bg-muted/50'}
                          ${cell?.redacted ? 'bg-red-100 dark:bg-red-900/20' : ''}
                          ${cell?.locked ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''}
                        `}
                        onClick={() => handleCellClick(row, col)}
                        style={{
                          fontWeight: cell?.format?.font?.bold ? 'bold' : 'normal',
                          fontStyle: cell?.format?.font?.italic ? 'italic' : 'normal',
                          textDecoration: cell?.format?.font?.underline ? 'underline' : 'none',
                          color: cell?.format?.font?.color || 'inherit',
                          backgroundColor: cell?.format?.background || 'transparent',
                          textAlign: cell?.format?.alignment?.horizontal || 'left',
                        }}
                      >
                        <div className="px-2 py-1 h-full flex items-center overflow-hidden">
                          {cell?.redacted ? '████████' : getCellValue(row, col)}
                        </div>
                        
                        {cell?.redacted && (
                          <div className="absolute top-0 right-0 p-1">
                            <Shield className="h-3 w-3 text-red-500" />
                          </div>
                        )}
                        
                        {cell?.locked && (
                          <div className="absolute top-0 left-0 p-1">
                            <Lock className="h-3 w-3 text-yellow-500" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/30 text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>
            {currentSheet ? `${currentSheet.cells.filter(c => c.value).length} cells with data` : '0 cells'}
          </span>
          <span>
            Sheet: {currentSheet?.name || 'None'}
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <div className="flex items-center space-x-1">
            <Shield className="h-3 w-3 text-green-500" />
            <span className="text-green-500">Secure</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadsheetPage;