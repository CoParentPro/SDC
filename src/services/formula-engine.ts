import { SpreadsheetCell } from '../types';

export class FormulaEngine {
  private static readonly FUNCTIONS: Record<string, Function> = {
    SUM: (...args: number[]) => args.reduce((sum, val) => sum + val, 0),
    AVERAGE: (...args: number[]) => args.reduce((sum, val) => sum + val, 0) / args.length,
    COUNT: (...args: any[]) => args.filter(val => val !== null && val !== undefined && val !== '').length,
    MAX: (...args: number[]) => Math.max(...args),
    MIN: (...args: number[]) => Math.min(...args),
    ABS: (value: number) => Math.abs(value),
    ROUND: (value: number, decimals: number = 0) => Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals),
    FLOOR: (value: number) => Math.floor(value),
    CEIL: (value: number) => Math.ceil(value),
    SQRT: (value: number) => Math.sqrt(value),
    POWER: (base: number, exponent: number) => Math.pow(base, exponent),
    LN: (value: number) => Math.log(value),
    LOG: (value: number, base: number = 10) => Math.log(value) / Math.log(base),
    EXP: (value: number) => Math.exp(value),
    RAND: () => Math.random(),
    RANDBETWEEN: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    
    // Date functions
    TODAY: () => new Date(),
    NOW: () => new Date(),
    YEAR: (date: Date) => date.getFullYear(),
    MONTH: (date: Date) => date.getMonth() + 1,
    DAY: (date: Date) => date.getDate(),
    HOUR: (date: Date) => date.getHours(),
    MINUTE: (date: Date) => date.getMinutes(),
    SECOND: (date: Date) => date.getSeconds(),
    
    // Text functions
    CONCATENATE: (...args: any[]) => args.join(''),
    UPPER: (text: string) => text.toUpperCase(),
    LOWER: (text: string) => text.toLowerCase(),
    LEN: (text: string) => text.length,
    LEFT: (text: string, count: number) => text.substring(0, count),
    RIGHT: (text: string, count: number) => text.substring(text.length - count),
    MID: (text: string, start: number, length: number) => text.substring(start - 1, start - 1 + length),
    TRIM: (text: string) => text.trim(),
    
    // Logical functions
    IF: (condition: boolean, trueValue: any, falseValue: any) => condition ? trueValue : falseValue,
    AND: (...args: boolean[]) => args.every(Boolean),
    OR: (...args: boolean[]) => args.some(Boolean),
    NOT: (value: boolean) => !value,
    ISNUMBER: (value: any) => typeof value === 'number' && !isNaN(value),
    ISTEXT: (value: any) => typeof value === 'string',
    ISBLANK: (value: any) => value === null || value === undefined || value === '',
  };

  /**
   * Evaluate a formula and return the result
   */
  static evaluate(formula: string, cells: SpreadsheetCell[]): any {
    if (!formula.startsWith('=')) {
      return formula;
    }

    try {
      // Remove the = sign
      const expression = formula.substring(1);
      
      // Replace cell references with actual values
      const processedExpression = this.replaceCellReferences(expression, cells);
      
      // Process range functions
      const withRanges = this.processRanges(processedExpression, cells);
      
      // Process function calls
      const withFunctions = this.processFunctions(withRanges);
      
      // Evaluate the final expression
      return this.evaluateExpression(withFunctions);
    } catch (error) {
      console.error('Formula evaluation error:', error);
      return '#ERROR';
    }
  }

  /**
   * Replace cell references (A1, B2) with actual values
   */
  private static replaceCellReferences(expression: string, cells: SpreadsheetCell[]): string {
    const cellRefRegex = /\b([A-Z]+)(\d+)\b/g;
    
    return expression.replace(cellRefRegex, (match, colStr, rowStr) => {
      const col = this.columnStringToNumber(colStr);
      const row = parseInt(rowStr) - 1;
      
      const cell = cells.find(c => c.row === row && c.col === col);
      const value = cell?.value || 0;
      
      if (typeof value === 'number') {
        return value.toString();
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        return value;
      } else {
        return `"${value}"`;
      }
    });
  }

  /**
   * Process range expressions (A1:A10)
   */
  private static processRanges(expression: string, cells: SpreadsheetCell[]): string {
    const rangeRegex = /\b([A-Z]+)(\d+):([A-Z]+)(\d+)\b/g;
    
    return expression.replace(rangeRegex, (match, startColStr, startRowStr, endColStr, endRowStr) => {
      const startCol = this.columnStringToNumber(startColStr);
      const startRow = parseInt(startRowStr) - 1;
      const endCol = this.columnStringToNumber(endColStr);
      const endRow = parseInt(endRowStr) - 1;
      
      const rangeValues: any[] = [];
      
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const cell = cells.find(c => c.row === row && c.col === col);
          const value = cell?.value || 0;
          
          if (typeof value === 'number') {
            rangeValues.push(value);
          } else if (typeof value === 'string' && !isNaN(Number(value))) {
            rangeValues.push(Number(value));
          } else {
            rangeValues.push(value);
          }
        }
      }
      
      return `[${rangeValues.join(',')}]`;
    });
  }

  /**
   * Process function calls
   */
  private static processFunctions(expression: string): string {
    const functionRegex = /\b([A-Z_]+)\s*\((.*?)\)/g;
    
    return expression.replace(functionRegex, (match, funcName, argsStr) => {
      const func = this.FUNCTIONS[funcName];
      if (!func) {
        throw new Error(`Unknown function: ${funcName}`);
      }

      // Parse arguments
      const args = this.parseArguments(argsStr);
      
      try {
        const result = func(...args);
        return typeof result === 'string' ? `"${result}"` : result.toString();
      } catch (error) {
        throw new Error(`Error in function ${funcName}: ${error}`);
      }
    });
  }

  /**
   * Parse function arguments
   */
  private static parseArguments(argsStr: string): any[] {
    if (!argsStr.trim()) return [];
    
    const args: any[] = [];
    let currentArg = '';
    let inQuotes = false;
    let inArray = false;
    let parenthesisLevel = 0;
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      
      if (char === '"' && !inArray) {
        inQuotes = !inQuotes;
        currentArg += char;
      } else if (char === '[' && !inQuotes) {
        inArray = true;
        currentArg += char;
      } else if (char === ']' && !inQuotes) {
        inArray = false;
        currentArg += char;
      } else if (char === '(' && !inQuotes && !inArray) {
        parenthesisLevel++;
        currentArg += char;
      } else if (char === ')' && !inQuotes && !inArray) {
        parenthesisLevel--;
        currentArg += char;
      } else if (char === ',' && !inQuotes && !inArray && parenthesisLevel === 0) {
        args.push(this.parseValue(currentArg.trim()));
        currentArg = '';
      } else {
        currentArg += char;
      }
    }
    
    if (currentArg.trim()) {
      args.push(this.parseValue(currentArg.trim()));
    }
    
    return args;
  }

  /**
   * Parse a single value
   */
  private static parseValue(valueStr: string): any {
    valueStr = valueStr.trim();
    
    // Array
    if (valueStr.startsWith('[') && valueStr.endsWith(']')) {
      const arrayContent = valueStr.slice(1, -1);
      if (!arrayContent) return [];
      
      return arrayContent.split(',').map(item => this.parseValue(item.trim()));
    }
    
    // String
    if (valueStr.startsWith('"') && valueStr.endsWith('"')) {
      return valueStr.slice(1, -1);
    }
    
    // Boolean
    if (valueStr.toLowerCase() === 'true') return true;
    if (valueStr.toLowerCase() === 'false') return false;
    
    // Number
    if (!isNaN(Number(valueStr))) {
      return Number(valueStr);
    }
    
    // Date
    if (valueStr.match(/^\d{4}-\d{2}-\d{2}/) || valueStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}/)) {
      return new Date(valueStr);
    }
    
    return valueStr;
  }

  /**
   * Evaluate mathematical expressions
   */
  private static evaluateExpression(expression: string): any {
    try {
      // Remove any remaining quotes around strings
      expression = expression.replace(/^"(.*)"$/, '$1');
      
      // For simple numbers, return as-is
      if (!isNaN(Number(expression))) {
        return Number(expression);
      }
      
      // For basic mathematical expressions, use eval (in a controlled way)
      // In production, this should be replaced with a proper expression parser
      if (/^[\d\s+\-*/().]+$/.test(expression)) {
        return eval(expression);
      }
      
      return expression;
    } catch (error) {
      throw new Error(`Expression evaluation failed: ${error}`);
    }
  }

  /**
   * Convert column string (A, B, AA) to number (0, 1, 26)
   */
  private static columnStringToNumber(colStr: string): number {
    let result = 0;
    for (let i = 0; i < colStr.length; i++) {
      result = result * 26 + (colStr.charCodeAt(i) - 64);
    }
    return result - 1;
  }

  /**
   * Convert column number to string
   */
  static columnNumberToString(col: number): string {
    let result = '';
    col += 1; // Convert to 1-based
    
    while (col > 0) {
      col--;
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26);
    }
    
    return result;
  }

  /**
   * Get all cell references in a formula
   */
  static getCellReferences(formula: string): Array<{ row: number; col: number }> {
    const references: Array<{ row: number; col: number }> = [];
    
    if (!formula.startsWith('=')) {
      return references;
    }

    const expression = formula.substring(1);
    const cellRefRegex = /\b([A-Z]+)(\d+)\b/g;
    
    let match;
    while ((match = cellRefRegex.exec(expression)) !== null) {
      const col = this.columnStringToNumber(match[1]);
      const row = parseInt(match[2]) - 1;
      references.push({ row, col });
    }
    
    return references;
  }

  /**
   * Check if a formula has circular references
   */
  static hasCircularReference(
    formula: string, 
    currentRow: number, 
    currentCol: number, 
    cells: SpreadsheetCell[]
  ): boolean {
    const references = this.getCellReferences(formula);
    
    // Check direct circular reference
    if (references.some(ref => ref.row === currentRow && ref.col === currentCol)) {
      return true;
    }
    
    // Check indirect circular references (simplified)
    for (const ref of references) {
      const referencedCell = cells.find(c => c.row === ref.row && c.col === ref.col);
      if (referencedCell?.formula) {
        const indirectRefs = this.getCellReferences(referencedCell.formula);
        if (indirectRefs.some(indRef => indRef.row === currentRow && indRef.col === currentCol)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Validate a formula syntax
   */
  static validateFormula(formula: string): { valid: boolean; error?: string } {
    if (!formula.startsWith('=')) {
      return { valid: false, error: 'Formula must start with =' };
    }

    try {
      const expression = formula.substring(1);
      
      // Check for balanced parentheses
      let parenCount = 0;
      for (const char of expression) {
        if (char === '(') parenCount++;
        if (char === ')') parenCount--;
        if (parenCount < 0) {
          return { valid: false, error: 'Unbalanced parentheses' };
        }
      }
      
      if (parenCount !== 0) {
        return { valid: false, error: 'Unbalanced parentheses' };
      }
      
      // Check for unknown functions
      const functionRegex = /\b([A-Z_]+)\s*\(/g;
      let match;
      while ((match = functionRegex.exec(expression)) !== null) {
        if (!this.FUNCTIONS[match[1]]) {
          return { valid: false, error: `Unknown function: ${match[1]}` };
        }
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error instanceof Error ? error.message : 'Invalid formula' };
    }
  }
}