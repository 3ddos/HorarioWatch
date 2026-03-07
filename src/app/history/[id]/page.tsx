"use client";

import { useAppStore, ScheduleItem } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Trash2, Plus, Clock, Calendar as CalendarIcon, Info, Bug } from "lucide-react";
import { format } from "date-fns";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LogDetailsPage() {
  const { id } = useParams() as { id: string };
  const { logs, updateLog, deleteLog, isLoaded } = useAppStore();
  const router = useRouter();
  const { toast } = useToast();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const log = logs.find((l) => l.id === id);

  useEffect(() => {
    if (isLoaded && log) {
      setSchedule(log.schedule);
    }
  }, [isLoaded, log]);

  if (!isLoaded) return null;
  if (!log) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h1 className="text-2xl font-bold text-primary">Log not found</h1>
        <Button onClick={() => router.push("/history")}>Back to History</Button>
      </div>
    );
  }

  const handleUpdateItem = (index: number, field: keyof ScheduleItem, value: string) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleRemoveItem = (index: number) => {
    setSchedule(schedule.filter((_, i) => i !== index));
  };

  const handleAddItem = () => {
    setSchedule([...schedule, { day: format(new Date(), "yyyy-MM-dd"), hours: "09:00 - 17:00" }]);
  };

  const handleSaveChanges = () => {
    updateLog(id, { schedule });
    toast({
      title: "Schedule Updated",
      description: "The schedule changes have been saved successfully.",
    });
  };

  const handleDeleteLog = () => {
    deleteLog(id);
    toast({
      title: "Log Deleted",
      description: "The activity log has been removed.",
    });
    router.push("/history");
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Log
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this processing log and its extracted schedule data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteLog} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={handleSaveChanges} className="bg-primary hover:bg-primary/90">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      {log.reasoning && (
        <Alert className="bg-blue-50 border-blue-200">
          <Bug className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">AI Extraction Reasoning (Debug Info)</AlertTitle>
          <AlertDescription className="text-blue-700 mt-2 whitespace-pre-wrap">
            {log.reasoning}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Timestamp</Label>
                <p className="font-medium">{format(new Date(log.timestamp), "PPPP p")}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <p className="font-medium">{log.emailSubject}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Person Identified</Label>
                <p className="font-medium text-primary">{log.personName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sender</Label>
                <p className="font-medium">{log.sender}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-muted/20">
              <CardTitle className="text-xl flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Edit Schedule
              </CardTitle>
              <Button size="sm" variant="outline" onClick={handleAddItem} className="h-8">
                <Plus className="w-4 h-4 mr-1" />
                Add Day
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="flex flex-col gap-2 p-4 rounded-xl bg-muted/20 border border-muted/50 group">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex-1 w-full space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Date (YYYY-MM-DD)</Label>
                        <Input
                          value={item.day}
                          onChange={(e) => handleUpdateItem(index, "day", e.target.value)}
                          className="bg-white border-muted"
                        />
                      </div>
                      <div className="flex-[1.5] w-full space-y-1">
                        <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Working Hours</Label>
                        <div className="relative">
                          <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            value={item.hours}
                            onChange={(e) => handleUpdateItem(index, "hours", e.target.value)}
                            className="pl-10 bg-white border-muted"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {item.rawCellData && (
                      <div className="flex items-center gap-2 mt-1">
                        <Info className="w-3 h-3 text-muted-foreground" />
                        <span className="text-[10px] text-muted-foreground italic">Raw PDF data: "{item.rawCellData}"</span>
                      </div>
                    )}
                  </div>
                ))}
                {schedule.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                    <p>No schedule items found. Click "Add Day" to manually add entries.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-muted/20 p-4">
              <p className="text-xs text-muted-foreground">
                Changes made here will be reflected in the Dashboard and History overview.
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
