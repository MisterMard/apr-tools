import { FC } from "react";
import { Column, useTable } from "react-table";


type Accessor = string;

// export interface Column {
//   Header?: string,
//   accessor?: Accessor,  // accessor is the "key" in the data
//   columns?: Column[],   // sub-headers
// }

export interface Row {
    [accessor: string]: string|number,
}

interface TableProbs {
    columns: Column<Row>[],
    data: Row[],
}

const Table: FC<TableProbs> = ({ columns, data }) => {
  // Use the state and functions returned from useTable to build your UI
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data,
    });
    

  // Render the UI for your table
  return (
    <table {...getTableProps()}>
      <thead>
        {headerGroups.map((headerGroup) => (
          <tr {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map((column) => (
              <th {...column.getHeaderProps()}>{column.render("Header")}</th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody {...getTableBodyProps()}>
        {rows.map((row, i) => {
          prepareRow(row);
          return (
            <tr {...row.getRowProps()}>
              {row.cells.map((cell) => {
                return <td {...cell.getCellProps()}>{cell.render("Cell")}</td>;
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default Table;
