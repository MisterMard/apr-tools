import { FC } from "react";
import { Column, useTable } from "react-table";
import CssBaseline from '@material-ui/core/CssBaseline'
import MaUTable from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'


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
  const { getTableProps, headerGroups, rows, prepareRow } = useTable({
    columns,
    data,
  })
    

  // Render the UI for your table
  return (
    <MaUTable {...getTableProps()}>
      <TableHead>
        {headerGroups.map(headerGroup => (
          <TableRow {...headerGroup.getHeaderGroupProps()} key={headerGroup.getHeaderGroupProps().key}>
            {headerGroup.headers.map(column => (
              <TableCell {...column.getHeaderProps()} key={column.getHeaderProps().key}>
                {column.render('Header')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {rows.map((row, i) => {
          prepareRow(row)
          return (
            <TableRow {...row.getRowProps()} key={row.getRowProps().key}>
              {row.cells.map(cell => {
                return (
                  <TableCell {...cell.getCellProps()} key={cell.getCellProps().key}>
                    {cell.render('Cell')}
                  </TableCell>
                )
              })}
            </TableRow>
          )
        })}
      </TableBody>
    </MaUTable>
  );
};

export default Table;
