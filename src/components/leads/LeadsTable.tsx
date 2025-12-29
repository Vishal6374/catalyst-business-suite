import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash2, UserCheck, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const statusColors: Record<string, string> = {
  new: "bg-info/10 text-info",
  contacted: "bg-warning/10 text-warning",
  qualified: "bg-primary/10 text-primary",
  proposal: "bg-chart-4/10 text-chart-4",
  negotiation: "bg-chart-5/10 text-chart-5",
  won: "bg-success/10 text-success",
  lost: "bg-destructive/10 text-destructive",
};

interface LeadsTableProps {
  leads: any[];
  selectedLeads: Set<string>;
  onSelectLead: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEdit: (lead: any) => void;
  onDelete: (id: string) => void;
  onConvert: (lead: any) => void;
  onView: (lead: any) => void;
}

export function LeadsTable({ leads, selectedLeads, onSelectLead, onSelectAll, onEdit, onDelete, onConvert, onView }: LeadsTableProps) {
  const allSelected = leads.length > 0 && selectedLeads.size === leads.length;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
              />
            </TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                No leads found.
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <Checkbox 
                    checked={selectedLeads.has(lead.id)}
                    onCheckedChange={(checked) => onSelectLead(lead.id, !!checked)}
                  />
                </TableCell>
                <TableCell className="font-medium">{lead.company_name || lead.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{lead.contact_name || "Unknown"}</span>
                    <span className="text-xs text-muted-foreground">{lead.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[lead.status] || "bg-muted"}>
                    {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell>{lead.source || "-"}</TableCell>
                <TableCell>${Number(lead.value || 0).toLocaleString()}</TableCell>
                <TableCell>{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView(lead)}>
                        <Eye className="mr-2 h-4 w-4" /> View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(lead)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onConvert(lead)}>
                        <UserCheck className="mr-2 h-4 w-4" /> Convert to Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => onDelete(lead.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
