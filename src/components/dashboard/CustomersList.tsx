import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, Mail, Clock, Download } from "lucide-react";
import { format } from "date-fns";

interface Customer {
  email: string;
  name: string | null;
  lastSeen: string;
  conversationsCount: number;
}

export function CustomersList({ businessId }: { businessId: string }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  // Reset when business changes
  useEffect(() => {
    setCustomers([]);
    setHasFetched(false);
    setLoading(false);
  }, [businessId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('conversations')
        .select('visitor_email, visitor_name, started_at')
        .eq('business_id', businessId)
        .not('visitor_email', 'is', null);

      if (error) throw error;

      // Group by email
      const customerMap = new Map<string, Customer>();
      
      data?.forEach((conv) => {
        if (!conv.visitor_email) return;
        
        const existing = customerMap.get(conv.visitor_email);
        
        if (!existing) {
          customerMap.set(conv.visitor_email, {
            email: conv.visitor_email,
            name: conv.visitor_name,
            lastSeen: conv.started_at,
            conversationsCount: 1,
          });
        } else {
          existing.conversationsCount += 1;
          if (new Date(conv.started_at) > new Date(existing.lastSeen)) {
            existing.lastSeen = conv.started_at;
            // Update name if we got a new one
            if (conv.visitor_name && !existing.name) {
              existing.name = conv.visitor_name;
            }
          }
        }
      });

      const sortedCustomers = Array.from(customerMap.values()).sort((a, b) => 
        new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime()
      );

      setCustomers(sortedCustomers);
      setHasFetched(true);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;

    // Create CSV header
    let csvContent = "Name,Email,Conversations,Last Active\n";

    // Add rows
    customers.forEach(customer => {
      const name = customer.name ? `"${customer.name.replace(/"/g, '""')}"` : "Anonymous";
      const email = `"${customer.email}"`;
      const convCount = customer.conversationsCount;
      const lastActive = `"${format(new Date(customer.lastSeen), "yyyy-MM-dd HH:mm:ss")}"`;
      
      csvContent += `${name},${email},${convCount},${lastActive}\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `customers_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="p-8 text-center animate-pulse">Loading customers...</div>;
  }

  return (
    <Card className="shadow-elegant border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          Collected Customers
        </CardTitle>
        {customers.length > 0 && (
          <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!hasFetched ? (
          <div className="text-center py-16 flex flex-col items-center justify-center bg-muted/20 rounded-lg border border-dashed">
            <Users className="w-12 h-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Load Customer Data</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Click below to scan your conversation history and extract all customer names and email addresses.
            </p>
            <Button onClick={fetchCustomers} disabled={loading} className="gap-2">
              <Download className="w-4 h-4" />
              {loading ? "Scanning Database..." : "Fetch Customers"}
            </Button>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
            <Users className="w-12 h-12 mb-4 opacity-20" />
            <p>No customers have provided their email yet.</p>
          </div>
        ) : (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Conversations</TableHead>
                  <TableHead>Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.email}>
                    <TableCell className="font-medium">
                      {customer.name || 'Anonymous'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {customer.email}
                      </div>
                    </TableCell>
                    <TableCell>{customer.conversationsCount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {format(new Date(customer.lastSeen), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
