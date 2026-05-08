'use client'

import Box from '@mui/material/Box'
import List from '@mui/material/List'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import { getColumnSpec, type AdRow, type ColumnId } from './columnSpecs'
import AdsMobileCard from './AdsMobileCard'
import AdsTableDesktopRow from './AdsTableDesktopRow'
import type { SortSpec } from './sliceToFilters'
import styles from './AdsTable.module.css'

interface Props {
  readonly rows: readonly AdRow[]
  readonly visibleColumns: readonly ColumnId[]
  readonly sort: SortSpec
  readonly onSortChange: (sort: SortSpec) => void
}

export default function AdsTable({
  rows,
  visibleColumns,
  sort,
  onSortChange,
}: Props): JSX.Element {
  if (rows.length === 0) {
    return (
      <Box className={styles.root}>
        <Typography className={styles.empty}>No ads match these filters.</Typography>
      </Box>
    )
  }

  function handleHeaderClick(column: ColumnId): void {
    if (sort.field === column) {
      onSortChange({ field: column, direction: sort.direction === 'desc' ? 'asc' : 'desc' })
      return
    }
    onSortChange({ field: column, direction: 'desc' })
  }

  return (
    <Box className={styles.root}>
      <TableContainer className={styles.tableContainer}>
        <Table size="small" className={styles.table}>
          <TableHead className={styles.tableHead}>
            <TableRow>
              <TableCell className={styles.thumbCell} aria-hidden />
              <TableCell className={styles.nameCell}>Ad name</TableCell>
              <TableCell className={styles.accountCell}>Account</TableCell>
              {visibleColumns.map((id) => {
                const spec = getColumnSpec(id)
                const active = sort.field === id
                return (
                  <TableCell
                    key={id}
                    align="left"
                    sortDirection={active ? sort.direction : false}
                    className={styles.metricCell}
                  >
                    <Tooltip title={spec.help} arrow disableInteractive>
                      <TableSortLabel
                        active={active}
                        direction={active ? sort.direction : 'desc'}
                        onClick={() => handleHeaderClick(id)}
                      >
                        {spec.shortLabel}
                      </TableSortLabel>
                    </Tooltip>
                  </TableCell>
                )
              })}
              <TableCell className={styles.openLinkCell} aria-hidden />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <AdsTableDesktopRow
                key={row.adId}
                row={row}
                visibleColumns={visibleColumns}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <List className={styles.mobileList} disablePadding>
        {rows.map((row) => (
          <AdsMobileCard key={row.adId} row={row} visibleColumns={visibleColumns} />
        ))}
      </List>
    </Box>
  )
}
