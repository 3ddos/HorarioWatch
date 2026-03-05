
"use client";

import { useState, useEffect } from "react";
import { useAppStore, Config } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Mail, User, Filter, Save, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ConfigPage() {
  const { config, saveConfig, isLoaded } = useAppStore();
  const [formData, setFormData] = useState<Config>(config);
  const { toast } = useToast();

  useEffect(() => {
    if (isLoaded) {
      setFormData(config);
    }
  }, [isLoaded, config]);

  const handleSave = () => {
    saveConfig(formData);
    toast({
      title: "Configuration Saved",
      description: "Watcher settings have been updated successfully.",
    });
  };

  if (!isLoaded) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Configuration</h1>
        <p className="text-muted-foreground mt-2">Manage your email filters and target identification.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="text-primary" />
            </div>
            <CardTitle>Email Watcher</CardTitle>
            <CardDescription>Configure how we find the schedule emails in your Gmail account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="gmail">Gmail Account</Label>
              <Input 
                id="gmail" 
                placeholder="you@gmail.com" 
                value={formData.gmailUser}
                onChange={(e) => setFormData({ ...formData, gmailUser: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sender">Sender Email Filter</Label>
              <div className="relative">
                <Filter className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  id="sender" 
                  className="pl-10" 
                  placeholder="e.g. hr@company.com" 
                  value={formData.senderFilter}
                  onChange={(e) => setFormData({ ...formData, senderFilter: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Pattern</Label>
              <Input 
                id="subject" 
                placeholder="e.g. Weekly Schedule" 
                value={formData.subjectFilter}
                onChange={(e) => setFormData({ ...formData, subjectFilter: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-none bg-white">
          <CardHeader>
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <User className="text-accent" />
            </div>
            <CardTitle>Target Identification</CardTitle>
            <CardDescription>Define the person whose schedule you want to extract.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="target">Full Name (Exactly as in PDF)</Label>
              <Input 
                id="target" 
                placeholder="e.g. Jane Doe" 
                value={formData.targetPerson}
                onChange={(e) => setFormData({ ...formData, targetPerson: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-muted">
              <div className="space-y-0.5">
                <Label>Auto-Process</Label>
                <p className="text-xs text-muted-foreground">Automatically extract data when email arrives.</p>
              </div>
              <Switch 
                checked={formData.autoProcess} 
                onCheckedChange={(val) => setFormData({ ...formData, autoProcess: val })}
              />
            </div>
          </CardContent>
          <CardFooter className="pt-6">
            <Button onClick={handleSave} className="w-full bg-primary hover:bg-primary/90">
              <Save className="mr-2 w-4 h-4" />
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
