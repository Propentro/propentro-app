import '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface TableMeta<TData extends RowData> {
    handleDeleteRow?: (row: TData) => void;
    handleMultipleDelete?: (rows: TData[]) => void;
    handleStatusChange?: (id: string, value: string) => void;
  }
}
