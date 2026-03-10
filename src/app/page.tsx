"use client";

import { useState, useRef, useMemo } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { Play, RotateCw, Clock, ArrowRight, Upload, FileSpreadsheet, Calendar as CalendarIcon, Info } from "lucide-react";
import { extractPersonScheduleFromPdf } from "@/ai/flows/extract-person-schedule-from-pdf";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from 'xlsx';
import { parse, isSameDay, format } from "date-fns";
import { extractPersonScheduleFromExcel } from "@/lib/excel-parser";

export default function Dashboard() {
  const { config, logs, addLog, isLoaded, user } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const lastSuccessfulLog = useMemo(() => logs.find(l => l.status === 'success'), [logs]);
  const recentLogs = useMemo(() => logs.slice(0, 3), [logs]);

  const scheduledDates = useMemo(() => {
    if (!lastSuccessfulLog) return [];
    return lastSuccessfulLog.schedule.map(item => {
      try {
        return parse(item.start_time.substring(0, 10), "yyyy-MM-dd", new Date());
      } catch (e) {
        return null;
      }
    }).filter((d): d is Date => d !== null);
  }, [lastSuccessfulLog]);

  const selectedShift = useMemo(() => {
    if (!lastSuccessfulLog || !selectedDate) return null;
    return lastSuccessfulLog.schedule.find(item => {
      try {
        const itemDate = parse(item.start_time.substring(0, 10), "yyyy-MM-dd", new Date());
        return isSameDay(itemDate, selectedDate);
      } catch (e) {
        return false;
      }
    });
  }, [lastSuccessfulLog, selectedDate]);

  if (!isLoaded) return null;

  const processFile = async (fileName: string, result: { schedule: any[], reasoning: string }) => {
    if (!user?.name) {
      toast({
        variant: "destructive",
        title: "Configuration Missing",
        description: "Please set a target person name in configuration.",
      });
      return;
    }

    setIsProcessing(true);

    try {
      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        emailSubject: `Manual Upload: ${fileName}`,
        sender: "Manual Upload",
        personName: user.name,
        schedule: result.schedule,
        reasoning: result.reasoning,
        status: result.schedule.length > 0 ? 'success' : 'failed'
      });

      if (result.schedule.length > 0) {
        toast({
          title: "Processing Complete",
          description: `Schedule for ${user.name} has been extracted.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Schedule Found",
          description: result.reasoning,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "An error occurred while parsing the document.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.name) return;

    setIsProcessing(true);
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExt === "pdf") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64DataUri = e.target?.result as string;
          const result = await extractPersonScheduleFromPdf({
            pdfDataUri: base64DataUri,
            personName: user.name
          });
          await processFile(file.name, result);
        };
        reader.readAsDataURL(file);
      } else if (fileExt === "csv" || fileExt === "xlsx" || fileExt === "xls") {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const result = extractPersonScheduleFromExcel(workbook, user.name, file.name);
          await processFile(file.name, result);
        };
        reader.readAsArrayBuffer(file);
      } else {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: "Please upload a PDF, CSV, or XLSX document.",
        });
        setIsProcessing(false);
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: "An error occurred while reading the file.",
      });
      setIsProcessing(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const simulateProcessing = async () => {
    if (!user?.name) return;
    setIsProcessing(true);
    try {
      const dummyPdfUri = "data:application/pdf;base64,JVBERi0xLjQKJ...[rest of dummy pdf data]";
      const result = await extractPersonScheduleFromPdf({
        pdfDataUri: dummyPdfUri,
        personName: user.name
      });
      await processFile("Simulated Schedule.pdf", result);
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Overview</h1>
          <p className="text-muted-foreground mt-2">Welcome back. Everything is running smoothly.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv,.xlsx,.xls"
            className="hidden"
          />
          <Button
            variant="outline"
            disabled={isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="border-accent text-accent hover:bg-accent/10"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload PDF/Excel
          </Button>
          <Button
            disabled={isProcessing}
            onClick={simulateProcessing}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isProcessing ? (
              <RotateCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4 fill-current" />
            )}
            Trigger Manual Scan
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-80">Processed Files</CardTitle>
            <div className="text-4xl font-bold">{logs.length}</div>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-60">Total documents scanned</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Target Person</CardTitle>
            <div className="text-2xl font-bold text-primary truncate">
              {user?.name || "Not configured"}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scanning for: {user?.email}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">System Status</CardTitle>
            <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              Active
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Watching for new files</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm bg-white min-h-[400px]">
            <CardHeader className="border-b border-muted/20">
              <CardTitle className="flex items-center gap-2 font-headline text-xl">
                <CalendarIcon className="text-primary w-5 h-5" />
                Schedule Calendar
              </CardTitle>
              <CardDescription>
                {lastSuccessfulLog ? `Viewing schedule for ${lastSuccessfulLog.personName}` : "Upload a file to view your schedule."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {lastSuccessfulLog ? (
                <div className="flex flex-col md:flex-row gap-8 items-start justify-center">
                  <div className="p-4 bg-muted/20 rounded-2xl border border-muted/50 w-fit mx-auto md:mx-0 shrink-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      className="rounded-md border-none"
                      modifiers={{
                        hasShift: scheduledDates
                      }}
                      modifiersClassNames={{
                        hasShift: "bg-primary/20 text-primary font-bold hover:bg-primary/30"
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-6 w-full max-w-sm">
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                      <h3 className="font-semibold text-primary mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Selected Date
                      </h3>
                      <p className="text-lg font-bold">
                        {selectedDate ? format(selectedDate, "PPP") : "No date selected"}
                      </p>
                    </div>

                    {selectedShift ? (
                      <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
                          <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider opacity-80">Working Hours</span>
                            {selectedShift.off ? (
                              <div className="text-2xl font-bold">Off</div>
                            ) : (
                              <div className="text-2xl font-bold">{selectedShift.start_time.split('T')[1].split('+')[0]}</div>
                            )}
                          </div>
                          <div className="bg-white/20 p-3 rounded-full">
                            <Clock className="w-6 h-6" />
                          </div>
                        </div>
                        {selectedShift.rawCellData && (
                          <div className="mt-4 flex items-start gap-2 p-3 bg-muted/30 rounded-lg text-xs text-muted-foreground border border-muted">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Parsed from document cell: <span className="font-mono font-semibold text-primary">{selectedShift.rawCellData}</span></p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground bg-muted/10 rounded-2xl border-2 border-dashed">
                        <Clock className="w-10 h-10 opacity-20 mb-2" />
                        <p>No shift scheduled for this day.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                  <FileSpreadsheet className="w-16 h-16 opacity-10 mb-4" />
                  <p>Upload a file to see your schedule on the calendar.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg font-headline">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-10">No recent activity.</p>
              ) : (
                recentLogs.map((log) => (
                  <div key={log.id} className="flex gap-4 items-start pb-4 last:pb-0 border-b last:border-0 border-muted/20">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-destructive'}`} />
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none truncate max-w-[200px]">{log.emailSubject}</p>
                      <p className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="ghost" className="w-full text-accent hover:text-accent" asChild>
                <a href="/history">
                  View Full History
                  <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-accent text-accent-foreground overflow-hidden relative">
            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <CardHeader>
              <CardTitle className="text-lg font-headline">AI Processor</CardTitle>
              <CardDescription className="text-accent-foreground/70">
                Ready to analyze PDF or spreadsheet documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Usage Limits</span>
                  <span>{logs.length} / 1,000</span>
                </div>
                <Progress value={(logs.length / 1000) * 100} className="h-1.5 bg-white/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
