import type { ReactNode } from "react";

export type TableColumn<Row> = {
  key: string;
  header: string;
  render: (row: Row) => ReactNode;
  className?: string;
};

type TableProps<Row> = {
  ariaLabel: string;
  rows: Row[];
  columns: TableColumn<Row>[];
  rowKey: (row: Row) => string;
  emptyMessage?: string;
};

export default function Table<Row>({
  ariaLabel,
  rows,
  columns,
  rowKey,
  emptyMessage = "No records found.",
}: TableProps<Row>) {
  return (
    <div className="w-full overflow-x-auto rounded-lg">
      <table aria-label={ariaLabel} className="w-full min-w-[680px] text-left text-sm">
        <thead className="bg-[#282931] text-white">
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" className={`px-4 py-3 font-semibold ${column.className ?? ""}`}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[#1f2028]">
          {rows.length > 0 ? rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-[#282931]">
              {columns.map((column) => (
                <td key={column.key} className={`px-4 py-3 align-middle ${column.className ?? ""}`}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          )) : (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
