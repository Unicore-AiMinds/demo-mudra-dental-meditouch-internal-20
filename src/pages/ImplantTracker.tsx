// Implant Tracker (POC, front-end only). Implants received from several dealers: quantity left per
// dealer, use per patient, returns to the dealer. Sample data kept in the browser (no database yet).
import { useMemo, useState } from 'react';
import { Plus, Search, AlertTriangle, Boxes, FileDown, Info, MoreHorizontal, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsCompact } from '@/hooks/use-compact';
import { usePermissions } from '@/contexts/PermissionContext';
import { useDealers } from '@/contexts/DealersContext';
import { usePatients } from '@/contexts/PatientContext';
import { cn } from '@/lib/utils';
import { formatDateForFilename } from '@/utils/dateFormatter';
import {
  ConsumptionInput,
  DealerStock,
  Implant,
  ImplantState,
  ImplantStatus,
  IncomingInput,
  ReturnInput,
  dealerStock,
  implantStatus,
  implantTotal,
  pieces,
  recordConsumption,
  recordIncoming,
  recordReturn,
} from '@/lib/implants';
import { createSampleImplantState } from '@/lib/implantSample';
import { StatusBadge } from '@/components/implants/shared';
import { implantName, todayISO } from '@/components/implants/utils';
import ImplantFormDialog, { ImplantFormValues } from '@/components/implants/ImplantFormDialog';
import ImplantIncomingDialog from '@/components/implants/ImplantIncomingDialog';
import ImplantConsumeDialog from '@/components/implants/ImplantConsumeDialog';
import ImplantReturnDialog from '@/components/implants/ImplantReturnDialog';
import ImplantHistoryDialog from '@/components/implants/ImplantHistoryDialog';

// Kept while moving between pages; a page reload brings back the sample data
let savedState: ImplantState | null = null;

type DialogKind = 'form' | 'incoming' | 'consume' | 'return' | 'history';
type StatusFilter = 'all' | 'outofstock' | 'low' | 'expiring';

const FILTER_STATUS: Record<Exclude<StatusFilter, 'all'>, ImplantStatus> = {
  outofstock: 'Out of Stock',
  low: 'Low Stock',
  expiring: 'Expiring Soon',
};

interface Row {
  implant: Implant;
  total: number;
  dealers: DealerStock[];
  status: ImplantStatus;
}

const DealerChips = ({ dealers }: { dealers: DealerStock[] }) =>
  dealers.length === 0 ? (
    <span className="text-muted-foreground">-</span>
  ) : (
    <div className="flex flex-wrap gap-1">
      {dealers.map((d) => (
        <span
          key={d.dealerId}
          className={cn(
            'inline-flex items-center gap-1 rounded-full border bg-background px-2 py-0.5 text-xs whitespace-nowrap',
            d.left === 0 && 'text-muted-foreground'
          )}
        >
          {d.dealerName} <b className="font-semibold">{d.left}</b>
        </span>
      ))}
    </div>
  );

const SummaryCard = ({ icon, iconBg, title, value, note }: { icon: React.ReactNode; iconBg: string; title: string; value: number; note: string }) => (
  <Card className="card-shadow">
    <div className="p-4 flex items-center space-x-4">
      <div className={cn('p-2 rounded-full', iconBg)}>{icon}</div>
      <div>
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
    </div>
  </Card>
);

const ImplantTracker = () => {
  const { toast } = useToast();
  const isCompact = useIsCompact();
  const { hasPermission } = usePermissions();
  const { dealers } = useDealers();
  const { patients } = usePatients();

  const [state, setStateRaw] = useState<ImplantState>(() => savedState ?? (savedState = createSampleImplantState()));
  const setState = (next: ImplantState) => {
    savedState = next;
    setStateRaw(next);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<StatusFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openKind, setOpenKind] = useState<DialogKind | null>(null);

  const today = todayISO();
  const canAdd = hasPermission('stock.create');
  const canEdit = hasPermission('stock.edit');
  const canIncoming = hasPermission('stock.manage_batches');
  const canConsume = hasPermission('stock.consume');
  const canHistory = hasPermission('stock.view_batches');
  const canExport = hasPermission('stock.export');

  const rows: Row[] = useMemo(
    () =>
      [...state.implants]
        .sort((a, b) => a.item.localeCompare(b.item) || a.subItem.localeCompare(b.subItem, undefined, { numeric: true }))
        .map((implant) => ({
          implant,
          total: implantTotal(state, implant.id),
          dealers: dealerStock(state, implant.id, today),
          status: implantStatus(state, implant.id, today),
        })),
    [state, today]
  );

  const visibleRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (filterStatus !== 'all' && r.status !== FILTER_STATUS[filterStatus]) return false;
      if (!q) return true;
      return [r.implant.item, r.implant.subItem, r.implant.description, ...r.dealers.map((d) => d.dealerName)]
        .some((text) => text.toLowerCase().includes(q));
    });
  }, [rows, searchQuery, filterStatus]);

  const count = (status: ImplantStatus) => rows.filter((r) => r.status === status).length;
  const totalPieces = rows.reduce((sum, r) => sum + r.total, 0);

  // Dealers from Settings → Dealers, plus the dealers used in the sample data
  const dealerNames = useMemo(() => {
    const names = new Set<string>(dealers.map((d) => d.name.trim()).filter(Boolean));
    state.batches.forEach((b) => names.add(b.dealerName));
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [dealers, state.batches]);

  // Patient list from the ERP; the phone number tells apart patients with the same name
  const patientOptions = useMemo(() => {
    const seen = new Map<string, number>();
    patients.forEach((p) => seen.set(p.name, (seen.get(p.name) ?? 0) + 1));
    return patients.map((p) => ({
      value: p.id,
      label: (seen.get(p.name) ?? 0) > 1 && p.phone ? `${p.name} (${p.phone})` : p.name,
    }));
  }, [patients]);

  const selected = state.implants.find((i) => i.id === selectedId) ?? null;

  const open = (kind: DialogKind, implantId: string | null) => {
    setSelectedId(implantId);
    setOpenKind(kind);
  };
  const close = () => setOpenKind(null);
  const dialogProps = (kind: DialogKind) => ({ open: openKind === kind, onOpenChange: (o: boolean) => !o && close() });

  const handleSaveImplant = (values: ImplantFormValues) => {
    if (selected && openKind === 'form') {
      setState({ ...state, implants: state.implants.map((i) => (i.id === selected.id ? { ...i, ...values } : i)) });
      toast({ title: 'Implant Updated', description: `${values.item} (${values.subItem}) has been updated.` });
    } else {
      const implant: Implant = { id: `imp-${Date.now().toString(36)}`, ...values };
      setState({ ...state, implants: [...state.implants, implant] });
      toast({ title: 'Implant Added', description: `${implantName(implant)} has been added.` });
    }
    close();
  };

  const handleIncoming = (input: IncomingInput) => {
    setState(recordIncoming(state, input));
    close();
    const total = input.rows.reduce((sum, r) => sum + r.quantity, 0);
    toast({ title: 'Stock Added', description: `${pieces(total)} of ${selected ? implantName(selected) : ''} recorded.` });
  };

  const handleConsume = (input: ConsumptionInput) => {
    const next = recordConsumption(state, input, today);
    setState(next);
    close();
    toast({ title: 'Consumption Recorded', description: `${pieces(input.quantity)} used for ${input.patientName} (${next.transactions[0].dealerName}).` });
  };

  const handleReturn = (input: ReturnInput) => {
    const next = recordReturn(state, input);
    setState(next);
    close();
    toast({ title: 'Return Recorded', description: `${pieces(input.quantity)} returned to ${next.transactions[0].dealerName}.` });
  };

  const handleExport = () => {
    const quote = (text: string | number) => `"${String(text).replace(/"/g, '""')}"`;
    const headers = ['Item', 'Sub-item', 'Quantity', 'From Dealers', 'Min Threshold', 'Status', 'Description'];
    const csv = [
      headers.join(','),
      ...visibleRows.map((r) =>
        [
          quote(r.implant.item),
          quote(r.implant.subItem),
          r.total,
          quote(r.dealers.map((d) => `${d.dealerName}: ${d.left}`).join('; ')),
          r.implant.minThreshold,
          quote(r.status),
          quote(r.implant.description),
        ].join(',')
      ),
    ].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dental_implants_${formatDateForFilename()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Successful', description: `${visibleRows.length} records exported to CSV.` });
  };

  const actionsMenu = (implant: Implant, withEdit: boolean) => {
    const hasActions = canIncoming || canConsume;
    if (!hasActions && !canHistory && !(withEdit && canEdit)) return null;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${implantName(implant)}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {withEdit && canEdit && (
            <>
              <DropdownMenuItem onClick={() => open('form', implant.id)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              {(hasActions || canHistory) && <DropdownMenuSeparator />}
            </>
          )}
          {canIncoming && <DropdownMenuItem onClick={() => open('incoming', implant.id)}>Record Incoming</DropdownMenuItem>}
          {canConsume && <DropdownMenuItem onClick={() => open('consume', implant.id)}>Record Consumption</DropdownMenuItem>}
          {canIncoming && <DropdownMenuItem onClick={() => open('return', implant.id)}>Record Return</DropdownMenuItem>}
          {hasActions && canHistory && <DropdownMenuSeparator />}
          {canHistory && (
            <DropdownMenuItem onClick={() => open('history', implant.id)}>
              <Info className="h-4 w-4 mr-2" />
              View Batches & History
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const emptyText = 'No implants match your search criteria';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Implant Tracker</h1>
          <p className="text-muted-foreground">Manage and track dental implants from every dealer</p>
        </div>
        {canAdd && (
          <Button className="bg-dental-primary hover:bg-dental-dark" onClick={() => open('form', null)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Implant
          </Button>
        )}
      </div>

      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800 flex items-start gap-2">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>Demo with sample data. Changes are not saved and are reset when the page is reloaded.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Boxes className="h-5 w-5 text-dental-primary" />}
          iconBg="bg-blue-50"
          title="Total Implants"
          value={totalPieces}
          note="Pieces in stock, all dealers"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50"
          title="Out of Stock"
          value={count('Out of Stock')}
          note="Implants with zero quantity"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
          iconBg="bg-amber-50"
          title="Low Stock"
          value={count('Low Stock')}
          note="Implants below minimum threshold"
        />
        <SummaryCard
          icon={<AlertTriangle className="h-5 w-5 text-orange-500" />}
          iconBg="bg-orange-50"
          title="Expiring Soon"
          value={count('Expiring Soon')}
          note="Implants expiring within 60 days"
        />
      </div>

      <Card className="card-shadow">
        <CardHeader className="pb-2">
          <CardTitle>Implants</CardTitle>
          <CardDescription>Quantity left from each dealer</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search implants..." className="pl-8" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Tabs value={filterStatus} onValueChange={(v) => setFilterStatus(v as StatusFilter)} className="w-full lg:w-auto">
              <TabsList className={isCompact ? 'grid w-full grid-cols-2 h-auto gap-1' : undefined}>
                <TabsTrigger value="all">All Status</TabsTrigger>
                <TabsTrigger value="outofstock">Out of Stock</TabsTrigger>
                <TabsTrigger value="low">Low Stock</TabsTrigger>
                <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
              </TabsList>
            </Tabs>
            {canExport && (
              <Button variant="outline" className="flex gap-2 items-center" onClick={handleExport}>
                <FileDown className="h-4 w-4" />
                <span>Export</span>
              </Button>
            )}
          </div>

          {isCompact ? (
            <div className="space-y-3">
              {visibleRows.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">{emptyText}</div>
              ) : (
                visibleRows.map((r) => (
                  <div key={r.implant.id} className={cn('rounded-lg border p-3', r.status === 'Out of Stock' && 'bg-red-50')} data-testid="implant-card">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-medium">{r.implant.item}</div>
                        <div className="text-sm text-muted-foreground">{r.implant.subItem}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <StatusBadge status={r.status} />
                        {actionsMenu(r.implant, true)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-sm">
                      <span className="font-semibold">{pieces(r.total)}</span>
                      {r.total === 0 && <AlertTriangle className="h-3 w-3 text-red-600" />}
                      <span className="text-muted-foreground">· Min {r.implant.minThreshold}</span>
                    </div>
                    <div className="mt-2">
                      <DealerChips dealers={r.dealers} />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Sub-item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>From Dealers</TableHead>
                    <TableHead className="whitespace-nowrap">Min Threshold</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {emptyText}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleRows.map((r) => (
                      <TableRow key={r.implant.id} className={r.status === 'Out of Stock' ? 'bg-red-50' : ''}>
                        <TableCell className="font-medium">{r.implant.item}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.implant.subItem}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span>{pieces(r.total)}</span>
                            {r.status === 'Out of Stock' && <AlertTriangle className="h-3 w-3 text-red-600" />}
                            {r.status === 'Low Stock' && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DealerChips dealers={r.dealers} />
                        </TableCell>
                        <TableCell>{r.implant.minThreshold}</TableCell>
                        <TableCell>
                          <StatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => open('form', r.implant.id)}>
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                            )}
                            {actionsMenu(r.implant, false)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImplantFormDialog
        {...dialogProps('form')}
        implant={selected}
        existing={state.implants}
        onSave={handleSaveImplant}
      />
      {selected && (
        <>
          <ImplantIncomingDialog {...dialogProps('incoming')} implant={selected} dealerNames={dealerNames} onSave={handleIncoming} />
          <ImplantConsumeDialog {...dialogProps('consume')} implant={selected} state={state} patients={patientOptions} onSave={handleConsume} />
          <ImplantReturnDialog {...dialogProps('return')} implant={selected} state={state} onSave={handleReturn} />
          <ImplantHistoryDialog {...dialogProps('history')} implant={selected} state={state} />
        </>
      )}
    </div>
  );
};

export default ImplantTracker;
