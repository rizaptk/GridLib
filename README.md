# GridLib API Documentation

This library was generated by AI using the ROO CLINE extension and the Gemini 2.0 flash-ext model.

## Grid Configuration

The `Grid` class constructor accepts a configuration object with the following properties:

-   `rows`: Number of rows in the grid.
-   `cols`: Number of columns in the grid.
-   `freezeRows`: Number of top rows to freeze.
-   `freezeCols`: Number of left columns to freeze.

## Usage

1.  Include `style.css` in your HTML file.
2.  Add a `div` element with the `data-grid` attribute to your HTML file.
3.  Include `dist/grid.js` in your HTML file.
4.  Create a new `Grid` instance with your desired configuration.

## Features

-   **Selection:**
    -   Mouse click/drag for multi-select.
    -   Shift+click for range selection.
    -   Ctrl/Cmd+click for individual selection.
    -   Keyboard navigation with arrow keys and Tab.
    -   Clicking on the top-left cell selects all cells.
-   **Copy/Paste:** Ctrl+C/V (Cmd+C/V) for cell values.
-   **Column Resize:** Drag resize handles on column headers.
-   **Cell Edit:** Double-click/Enter for in-place edit; submit via Enter/focusout; cancel via Esc.
-   **Freeze:** Freeze top rows and left columns.
-   **Row Numbers:** Static column on the left to show row numbers.

## API

-   `setColumnTitle(col: number, title: string)`: Sets the title of the column at the given index.

## Cell Value Change

Cell value changes emit an async event.