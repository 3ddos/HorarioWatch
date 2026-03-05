
"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, RotateCw, Calendar, Clock, ArrowRight, Mail } from "lucide-react";
import { extractPersonScheduleFromPdf } from "@/ai/flows/extract-person-schedule-from-pdf";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { config, logs, addLog, isLoaded } = useAppStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (!isLoaded) return null;

  const lastSuccessfulLog = logs.find(l => l.status === 'success');
  const recentLogs = logs.slice(0, 3);

  const simulateProcessing = async () => {
    if (!config.targetPerson) {
      toast({
        variant: "destructive",
        title: "Configuration Missing",
        description: "Please set a target person name in configuration.",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Valid minimal PDF base64 string to prevent decoding errors
      const dummyPdfUri = "data:application/pdf;base64,JVBERi0xLjcKJeLjz9MKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPj4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCAwCj4+CnN0cmVhbQplbmRzdHJlYW0KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0YK";
      
      const result = await extractPersonScheduleFromPdf({
        pdfDataUri: dummyPdfUri,
        personName: config.targetPerson
      });

      addLog({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        emailSubject: `Weekly Schedule PDF - ${new Date().toLocaleDateString()}`,
        sender: config.senderFilter,
        personName: config.targetPerson,
        schedule: result.schedule,
        status: result.schedule.length > 0 ? 'success' : 'failed'
      });

      if (result.schedule.length > 0) {
        toast({
          title: "Processing Complete",
          description: `Schedule for ${config.targetPerson} has been updated.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Schedule Found",
          description: `Could not find a schedule for ${config.targetPerson} in the document.`,
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Processing Failed",
        description: "An error occurred while parsing the document. Please check the logs.",
      });
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

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-sm bg-primary text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium opacity-80">Processed Emails</CardTitle>
            <div className="text-4xl font-bold">{logs.length}</div>
          </CardHeader>
          <CardContent>
            <p className="text-sm opacity-60">Total emails scanned this month</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium text-muted-foreground">Target Person</CardTitle>
            <div className="text-2xl font-bold text-primary truncate">
              {config.targetPerson || "Not configured"}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Scanning for: {config.senderFilter}
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
            <p className="text-sm text-muted-foreground">Watching for new Gmail arrivals</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-none shadow-sm bg-white min-h-[400px]">
            <CardHeader className="border-b border-muted/20">
              <CardTitle className="flex items-center gap-2 font-headline">
                <Calendar className="text-primary w-5 h-5" />
                Latest Schedule: {lastSuccessfulLog?.personName || "N/A"}
              </CardTitle>
              <CardDescription>
                {lastSuccessfulLog ? `Extracted from: ${lastSuccessfulLog.emailSubject}` : "No schedules processed yet."}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {lastSuccessfulLog ? (
                <div className="grid gap-4">
                  {lastSuccessfulLog.schedule.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-muted/50 hover:border-accent/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-primary text-sm shadow-sm group-hover:bg-accent group-hover:text-white transition-colors">
                          {item.day.charAt(0)}
                        </div>
                        <span className="font-semibold text-lg">{item.day}</span>
                      </div>
                      <div className="flex items-center gap-2 text-primary font-medium bg-white px-4 py-2 rounded-full shadow-sm border border-border">
                        <Clock className="w-4 h-4" />
                        {item.hours}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground">
                  <Mail className="w-16 h-16 opacity-10 mb-4" />
                  <p>Wait for your first schedule email or trigger a manual scan.</p>
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
                      <p className="text-sm font-medium leading-none">{log.emailSubject}</p>
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
                Parsing engine is ready to analyze your next PDF attachment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span>Usage Limits</span>
                  <span>92 / 1,000</span>
                </div>
                <Progress value={9.2} className="h-1.5 bg-white/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
