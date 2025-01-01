"use strict";
class Grid {
    constructor(config) {
        this.cells = [];
        this.isDragging = false;
        this.startCell = null;
        this.copiedCells = [];
        this.headerCells = [];
        this.resizeHandle = null;
        this.resizingColIndex = null;
        this.startX = 0;
        this.startWidth = 0;
        this.rowNumberCells = [];
        this.config = config;
        this.container = document.querySelector('[data-grid]');
        this.init();
    }
    init() {
        console.log('Grid initialized');
        this.setGridColumns();
        this.createGrid();
        this.setupEventListeners();
    }
    setGridColumns() {
        this.container.style.gridTemplateColumns = `50px repeat(${this.config.cols}, 100px)`;
    }
    createGrid() {
        this.createHeaderRow();
        for (let row = 0; row < this.config.rows; row++) {
            this.cells[row] = [];
            const rowNumberCell = this.createRowNumberCell(row);
            this.rowNumberCells.push(rowNumberCell);
            this.container.appendChild(rowNumberCell.element);
            for (let col = 0; col < this.config.cols; col++) {
                const cell = this.createCell(row, col);
                this.cells[row][col] = cell;
                this.container.appendChild(cell.element);
                if (row < this.config.freezeRows) {
                    cell.element.classList.add('frozen-row');
                }
                if (col < this.config.freezeCols) {
                    cell.element.classList.add('frozen-col');
                }
            }
        }
    }
    createHeaderRow() {
        this.headerCells = [];
        const emptyHeaderCell = this.createHeaderCell(-1);
        emptyHeaderCell.element.textContent = '';
        this.headerCells.push(emptyHeaderCell);
        this.container.appendChild(emptyHeaderCell.element);
        for (let col = 0; col < this.config.cols; col++) {
            const headerCell = this.createHeaderCell(col);
            this.headerCells.push(headerCell);
            this.container.appendChild(headerCell.element);
            if (col < this.config.freezeCols) {
                headerCell.element.classList.add('frozen-col');
            }
        }
    }
    createHeaderCell(col) {
        const el = document.createElement('div');
        el.classList.add('grid-header-cell');
        if (col !== -1) {
            el.textContent = this.getColumnHeaderTitle(col);
        }
        const resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        el.appendChild(resizeHandle);
        const cell = {
            value: '',
            element: el,
            selected: false,
        };
        return cell;
    }
    createRowNumberCell(row) {
        const el = document.createElement('div');
        el.classList.add('grid-row-number-cell');
        el.textContent = (row + 1).toString();
        const cell = {
            value: '',
            element: el,
            selected: false,
        };
        return cell;
    }
    getColumnHeaderTitle(col) {
        let title = '';
        let num = col;
        while (num >= 0) {
            title = String.fromCharCode(65 + (num % 26)) + title;
            num = Math.floor(num / 26) - 1;
        }
        return title;
    }
    createCell(row, col) {
        const el = document.createElement('div');
        el.classList.add('grid-cell');
        el.tabIndex = 0;
        const cell = {
            value: '',
            element: el,
            selected: false,
        };
        return cell;
    }
    setupEventListeners() {
        this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.container.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.container.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.container.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.container.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.container.addEventListener('copy', this.handleCopy.bind(this));
        this.container.addEventListener('paste', this.handlePaste.bind(this));
        this.container.addEventListener('mousedown', this.handleResizeStart.bind(this));
        this.container.addEventListener('mousemove', this.handleResizeMove.bind(this));
        this.container.addEventListener('mouseup', this.handleResizeEnd.bind(this));
    }
    handleMouseDown(e) {
        this.isDragging = true;
        const cell = this.getCellFromElement(e.target);
        if (cell && cell.element.classList.contains('grid-header-cell') && this.headerCells.indexOf(cell) === 0) {
            this.selectAll();
            return;
        }
        if (cell && !cell.element.classList.contains('grid-header-cell')) {
            this.startCell = cell;
            if (e.shiftKey) {
                this.selectRange(cell);
            }
            else if (e.ctrlKey || e.metaKey) {
                this.toggleCellSelection(cell);
            }
            else {
                this.clearSelection();
                this.selectCell(cell);
                this.editCell(cell);
            }
        }
    }
    handleMouseMove(e) {
        if (!this.isDragging || !this.startCell)
            return;
        const cell = this.getCellFromElement(e.target);
        if (cell) {
            this.selectRange(cell);
        }
    }
    handleMouseUp() {
        this.isDragging = false;
        this.startCell = null;
    }
    handleKeyDown(e) {
        let activeCell = null;
        for (const row of this.cells) {
            for (const cell of row) {
                if (cell.element === document.activeElement) {
                    activeCell = cell;
                    break;
                }
            }
            if (activeCell)
                break;
        }
        if (!activeCell)
            return;
        let row = -1;
        let col = -1;
        for (let i = 0; i < this.cells.length; i++) {
            const cellRow = this.cells[i];
            const cellIndex = cellRow.indexOf(activeCell);
            if (cellIndex !== -1) {
                row = i;
                col = cellIndex;
                break;
            }
        }
        switch (e.key) {
            case 'ArrowUp':
                row = Math.max(0, row - 1);
                break;
            case 'ArrowDown':
                row = Math.min(this.config.rows - 1, row + 1);
                break;
            case 'ArrowLeft':
                col = Math.max(0, col - 1);
                break;
            case 'ArrowRight':
                col = Math.min(this.config.cols - 1, col + 1);
                break;
            case 'Tab':
                col = (col + 1) % this.config.cols;
                if (col === 0) {
                    row = Math.min(this.config.rows - 1, row + 1);
                }
                break;
            case 'Enter':
                this.editCell(activeCell);
                e.preventDefault();
                return;
            case 'Escape':
                this.cancelEdit(activeCell);
                e.preventDefault();
                return;
            default:
                return;
        }
        this.clearSelection();
        this.selectCell(this.cells[row][col]);
        this.cells[row][col].element.focus();
    }
    handleDoubleClick(e) {
        const cell = this.getCellFromElement(e.target);
        if (cell && !cell.element.classList.contains('grid-header-cell')) {
            this.editCell(cell);
        }
    }
    handleCopy(e) {
        var _a;
        this.copiedCells = [];
        for (const row of this.cells) {
            for (const cell of row) {
                if (cell.selected) {
                    this.copiedCells.push(cell);
                }
            }
        }
        if (this.copiedCells.length === 0)
            return;
        e.preventDefault();
        const text = this.copiedCells.map(cell => cell.value).join('\t');
        (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.setData('text/plain', text);
    }
    handlePaste(e) {
        var _a;
        const text = (_a = e.clipboardData) === null || _a === void 0 ? void 0 : _a.getData('text/plain');
        if (!text)
            return;
        e.preventDefault();
        const values = text.split('\t');
        let index = 0;
        for (const row of this.cells) {
            for (const cell of row) {
                if (cell.selected) {
                    cell.value = values[index] || '';
                    cell.element.textContent = cell.value;
                    this.emitCellValueChange(cell);
                    index++;
                }
            }
        }
    }
    handleResizeStart(e) {
        if (!(e.target instanceof HTMLDivElement) || !e.target.classList.contains('resize-handle'))
            return;
        this.resizeHandle = e.target;
        const headerCell = this.getCellFromElement(this.resizeHandle.parentElement);
        if (!headerCell)
            return;
        this.resizingColIndex = this.headerCells.indexOf(headerCell);
        this.startX = e.clientX;
        const grid = this.container;
        this.startWidth = parseInt(getComputedStyle(grid).gridTemplateColumns.split(' ')[this.resizingColIndex]);
    }
    handleResizeMove(e) {
        if (this.resizingColIndex === null)
            return;
        const width = e.clientX - this.startX;
        this.resizeColumn(this.resizingColIndex, width);
    }
    handleResizeEnd() {
        this.resizingColIndex = null;
        this.resizeHandle = null;
    }
    resizeColumn(colIndex, width) {
        if (colIndex < 0 || colIndex >= this.config.cols)
            return;
        const grid = this.container;
        const newWidth = Math.max(50, this.startWidth + width);
        const gridTemplateColumns = getComputedStyle(grid).gridTemplateColumns.split(' ');
        gridTemplateColumns[colIndex] = `${newWidth}px`;
        grid.style.gridTemplateColumns = gridTemplateColumns.join(' ');
    }
    getCellFromElement(element) {
        for (const cell of this.rowNumberCells) {
            if (cell.element === element) {
                return cell;
            }
        }
        for (const row of this.cells) {
            for (const cell of row) {
                if (cell.element === element) {
                    return cell;
                }
            }
        }
        for (const cell of this.headerCells) {
            if (cell.element === element) {
                return cell;
            }
        }
        return null;
    }
    selectCell(cell) {
        cell.selected = true;
        cell.element.classList.add('selected');
    }
    toggleCellSelection(cell) {
        cell.selected = !cell.selected;
        cell.element.classList.toggle('selected');
    }
    clearSelection() {
        for (const row of this.cells) {
            for (const cell of row) {
                cell.selected = false;
                cell.element.classList.remove('selected');
            }
        }
        for (const cell of this.rowNumberCells) {
            cell.selected = false;
            cell.element.classList.remove('selected');
        }
    }
    selectRange(endCell) {
        if (!this.startCell)
            return;
        let startRow = -1;
        let startCol = -1;
        for (let i = 0; i < this.cells.length; i++) {
            const cellRow = this.cells[i];
            const cellIndex = cellRow.indexOf(this.startCell);
            if (cellIndex !== -1) {
                startRow = i;
                startCol = cellIndex;
                break;
            }
        }
        let endRow = -1;
        let endCol = -1;
        for (let i = 0; i < this.cells.length; i++) {
            const cellRow = this.cells[i];
            const cellIndex = cellRow.indexOf(endCell);
            if (cellIndex !== -1) {
                endRow = i;
                endCol = cellIndex;
                break;
            }
        }
        this.clearSelection();
        const rowStart = Math.min(startRow, endRow);
        const rowEnd = Math.max(startRow, endRow);
        const colStart = Math.min(startCol, endCol);
        const colEnd = Math.max(startCol, endCol);
        for (let row = rowStart; row <= rowEnd; row++) {
            for (let col = colStart; col <= colEnd; col++) {
                this.selectCell(this.cells[row][col]);
            }
        }
    }
    editCell(cell) {
        if (cell.editing)
            return;
        cell.editing = true;
        cell.element.contentEditable = 'true';
        cell.element.focus();
        cell.element.addEventListener('blur', () => this.handleCellBlur(cell), { once: true });
    }
    cancelEdit(cell) {
        if (!cell.editing)
            return;
        cell.editing = false;
        cell.element.contentEditable = 'false';
        cell.element.textContent = cell.value;
    }
    handleCellBlur(cell) {
        if (!cell.editing)
            return;
        cell.editing = false;
        cell.value = cell.element.textContent || '';
        cell.element.contentEditable = 'false';
        this.emitCellValueChange(cell);
    }
    async emitCellValueChange(cell) {
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 0));
        console.log('Cell value changed:', cell.value);
    }
    setColumnTitle(col, title) {
        if (col < 0 || col >= this.headerCells.length - 1)
            return;
        this.headerCells[col + 1].element.textContent = title;
    }
    selectAll() {
        this.clearSelection();
        for (const row of this.cells) {
            for (const cell of row) {
                this.selectCell(cell);
            }
        }
    }
}
//# sourceMappingURL=grid.js.map