import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateForFilename } from '@/utils/dateFormatter';

export interface DrillDownColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  /** Plain-text value used for search + CSV export (defaults to row[key]). */
  csv?: (row: T) => string;
}

interface DrillDownDialogProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  columns: DrillDownColumn<T>[];
  rows: T[];
  /** When provided, each row becomes clickable (e.g. to navigate to a patient). */
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** Optional dropdown filter on one column (e.g. 'status'). */
  filterKey?: string;
  filterLabel?: string;
  /** Base name for the exported CSV file. */
  exportFileName?: string;
}

const PAGE_SIZES = [10, 15, 25, 50];

function DrillDownDialog<T>({
  open,
  onOpenChange,
  title,
  description,
  columns,
  rows,
  onRowClick,
  emptyMessage = 'No records found.',
  filterKey,
  filterLabel = 'Filter',
  exportFileName = 'drilldown',
}: DrillDownDialogProps<T>) {
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  // plain-text value of a cell (for search, filter and CSV)
  const cellText = (row: T, col: DrillDownColumn<T>): string => {
    if (col.csv) return col.csv(row);
    const v = (row as Record<string, unknown>)[col.key];
    return v === undefined || v === null ? '' : String(v);
  };

  const filterCol = filterKey ? columns.find((c) => c.key === filterKey) : undefined;

  // distinct values for the optional dropdown filter
  const filterOptions = useMemo(() => {
    if (!filterCol) return [];
    const set = new Set<string>();
    rows.forEach((r) => {
      const t = cellText(r, filterCol).trim();
      if (t) set.add(t);
    });
    return Array.from(set).sort();
  }, [rows, filterCol]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filterCol && filterValue !== 'all' && cellText(row, filterCol) !== filterValue) {
        return false;
      }
      if (!q) return true;
      return columns.some((col) => cellText(row, col).toLowerCase().includes(q));
    });
  }, [rows, columns, search, filterValue, filterCol]); // eslint-disable-line react-hooks/exhaustive-deps

  // reset to first page whenever the result set changes
  useEffect(() => {
    setPage(1);
  }, [search, filterValue, pageSize, rows]);

  // reset controls when the dialog is (re)opened for a new segment
  useEffect(() => {
    if (open) {
      setSearch('');
      setFilterValue('all');
      setPage(1);
    }
  }, [open, title]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExport = () => {
    const esc = (s: string) => `"${String(s).replace(/"/g, '""')}"`;
    const header = columns.map((c) => esc(c.header)).join(',');
    const body = filteredRows
      .map((row) => columns.map((col) => esc(cellText(row, col))).join(','))
      .join('\r\n');
    const csv = '﻿' + header + '\r\n' + body;
    // Match the app's export naming: reports_<segment>_<date>.csv (lowercase, underscores)
    const segment = (exportFileName || 'export')
      .toLowerCase()
      .replace(/[^\w\s-]+/g, '')
      .trim()
      .replace(/\s+/g, '_') || 'export';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${segment}_${formatDateForFilename()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* Toolbar: search + optional filter + export */}
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full sm:w-64"
          />
          {filterCol && (
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="h-9 w-[150px]">
                <SelectValue placeholder={filterLabel} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {filterLabel}</SelectItem>
                {filterOptions.map((opt) => (
                  <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{filteredRows.length} record(s)</span>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredRows.length === 0}>
              <Download className="h-4 w-4 mr-2" /> Export (CSV)
            </Button>
          </div>
        </div>

        <div className="overflow-auto flex-1">
          {filteredRows.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">{emptyMessage}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key}>{col.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, rowIndex) => (
                  <TableRow
                    key={rowIndex}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={onRowClick ? 'cursor-pointer' : undefined}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.key}>
                        {col.render
                          ? col.render(row)
                          : ((row as Record<string, unknown>)[col.key] as React.ReactNode) ?? '-'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {filteredRows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Rows per page</span>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger className="h-8 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">Page {safePage} of {totalPages}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DrillDownDialog;
