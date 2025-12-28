import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function DealsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="page-title">Deals</h1><p className="page-description">Track your sales pipeline</p></div>
        <Button><Plus className="mr-2 h-4 w-4" />New Deal</Button>
      </div>
      <Card><CardContent className="py-12 text-center text-muted-foreground">No deals yet. Create your first deal to track your pipeline.</CardContent></Card>
    </div>
  );
}
