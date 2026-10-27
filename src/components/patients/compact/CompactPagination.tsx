import type { Table } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { PaginationLink } from '@/components/ui/pagination';

// Same 5-page window as the desktop pagination
const pageNumbers = (currentPage: number, totalPages: number) =>
  Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5 || currentPage < 3) return i;
    if (currentPage > totalPages - 4) return totalPages - 5 + i;
    return currentPage - 2 + i;
  }).filter(n => n >= 0 && n < totalPages);

// Patient list pagination for phones/tablets: the desktop controls on three lines
// (count line, buttons, page text).
const CompactPagination = <T,>({ table }: { table: Table<T> }) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <div className="space-y-3 py-4 text-sm">
      <div className="flex items-center justify-evenly gap-2">
        <div className="flex items-center gap-2">
        <p className="font-medium">Rows per page</p>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="h-8 w-[70px] rounded-md border border-input bg-background px-2 py-1 text-sm"
        >
          {[10, 20, 25, 50, 100].map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        </div>
        <span className="font-medium">
          {total > 0 && <>{pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, total)} of {total}</>}
        </span>
      </div>
      <div className="flex items-center justify-between gap-1">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          Previous
        </Button>
        <div className="flex items-center gap-1">
          {pageNumbers(pageIndex, table.getPageCount()).map(n => (
            <PaginationLink
              key={n}
              onClick={() => table.setPageIndex(n)}
              isActive={n === pageIndex}
              className="h-9 w-9 cursor-pointer"
            >
              {n + 1}
            </PaginationLink>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          Next
        </Button>
      </div>
      <div className="text-center font-medium text-muted-foreground">
        Page {pageIndex + 1} of {table.getPageCount()}
      </div>
    </div>
  );
};

export default CompactPagination;
