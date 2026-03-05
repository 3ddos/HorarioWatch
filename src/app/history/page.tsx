
"use client";

import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, CheckCircle2, XCircle, Search, ExternalLink, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export default function HistoryPage() {
  const { logs, isLoaded, deleteLog } = useAppStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  if (!isLoaded) return null;

  const filteredLogs = logs.filter(log => 
    log.emailSubject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.personName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: string) => {
    deleteLog(id);
    toast({
      title: "Log Deleted",
      description: "The activity log and its data have been removed.",
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Activity History</h1>
        <p className="text-muted-foreground mt-2">Log of all processed emails and extracted schedules.</p>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-border">
        <Search className="text-muted-foreground w-5 h-5" />
        <Input 
          placeholder="Search by subject or person..." 
          className="border-none bg-transparent focus-visible:ring-0 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Email Subject</TableHead>
              <TableHead>Target Person</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                  No processing logs found.
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell className="font-medium">
                    {format(new Date(log.timestamp), "MMM d, yyyy HH:mm")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span>{log.emailSubject}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.personName}</TableCell>
                  <TableCell>
                    {log.status === "success" ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 flex w-fit items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Processed
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="flex w-fit items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/history/${log.id}`}
                        className="inline-flex items-center gap-1 text-accent hover:underline text-sm font-medium mr-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        View Details
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Activity Log</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the log for &quot;{log.emailSubject}&quot;? This action will permanently remove all schedule items associated with it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(log.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
