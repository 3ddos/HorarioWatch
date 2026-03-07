"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export interface User {
  id: number | string;
  email: string;
  name: string;
}

export interface Config {
  gmailUser: string;
  senderFilter: string;
  subjectFilter: string;
  targetPerson: string;
  autoProcess: boolean;
}

export interface ScheduleItem {
  day: string;
  hours: string;
  rawCellData?: string;
}

export interface ProcessingLog {
  id: string;
  timestamp: string;
  emailSubject: string;
  sender: string;
  personName: string;
  schedule: ScheduleItem[];
  status: 'success' | 'failed';
  reasoning?: string;
}

const DEFAULT_CONFIG: Config = {
  gmailUser: "",
  senderFilter: "rh@empresa.com",
  subjectFilter: "Horarios Semanales",
  targetPerson: "Juan Perez",
  autoProcess: true,
};

export function useAppStore() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage for an existing session
    const storedUser = localStorage.getItem('hw_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('hw_user');
      }
    }
    setAuthLoaded(true);
  }, []);

  useEffect(() => {
    // Only load initial data if the user is authenticated.
    if (!user) {
      setLogs([]);
      setIsLoaded(true); // Don't block loading if they are just unauthenticated
      return;
    }

    async function loadData() {
      try {
        // Load config (we assume there's always one record with id = 1)
        const { data: configData, error: configError } = await supabase
          .from('config')
          .select('*')
          .eq('id', 1)
          .single();

        if (configData && !configError) {
          setConfig({
            gmailUser: configData.gmail_user || "",
            senderFilter: configData.sender_filter || "",
            subjectFilter: configData.subject_filter || "",
            targetPerson: configData.target_person || "",
            autoProcess: configData.auto_process ?? true,
          });
        }

        // Load logs
        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (logsData && !logsError) {
          setLogs(logsData.map(log => ({
            id: log.id,
            timestamp: log.timestamp,
            emailSubject: log.email_subject,
            sender: log.sender,
            personName: log.person_name,
            schedule: typeof log.schedule === 'string' ? JSON.parse(log.schedule) : log.schedule,
            status: log.status,
            reasoning: log.reasoning,
          })));
        }
      } catch (err) {
        console.error("Failed to load initial data from Supabase", err);
      } finally {
        setIsLoaded(true);
      }
    }

    loadData();
  }, []);

  const saveConfig = async (newConfig: Config) => {
    setConfig(newConfig);
    const { error } = await supabase
      .from('config')
      .upsert({
        id: 1,
        gmail_user: newConfig.gmailUser,
        sender_filter: newConfig.senderFilter,
        subject_filter: newConfig.subjectFilter,
        target_person: newConfig.targetPerson,
        auto_process: newConfig.autoProcess,
      });
    if (error) console.error('Error saving config:', error);
  };

  const addLog = async (log: ProcessingLog) => {
    const newLogs = [log, ...logs].slice(0, 50); // Keep last 50
    setLogs(newLogs);
    const { error } = await supabase
      .from('logs')
      .insert({
        id: log.id,
        timestamp: log.timestamp,
        email_subject: log.emailSubject,
        sender: log.sender,
        person_name: log.personName,
        schedule: log.schedule,
        status: log.status,
        reasoning: log.reasoning,
      });
    if (error) {
      console.error('Error adding log:', error);
    } else if (log.schedule && log.schedule.length > 0) {
      // Also save the schedule into the 'schedule' table
      const scheduleRecords = log.schedule.filter(item => item.hours !== "Off").map(item => ({
        user_id: user?.id,
        date: item.day,
        time: item.hours.split("-")[0].trim(),
        title: log.emailSubject,
        description: item.rawCellData || ""
      }));

      const { error: scheduleError } = await supabase
        .from('schedule')
        .insert(scheduleRecords);

      if (scheduleError) console.error('Error adding to schedule table:', scheduleError);
    }
  };

  const updateLog = async (id: string, updatedLog: Partial<ProcessingLog>) => {
    const newLogs = logs.map(log => log.id === id ? { ...log, ...updatedLog } : log);
    setLogs(newLogs);

    // Convert mapping for Supabase
    const supabaseUpdate: any = {};
    if (updatedLog.emailSubject !== undefined) supabaseUpdate.email_subject = updatedLog.emailSubject;
    if (updatedLog.personName !== undefined) supabaseUpdate.person_name = updatedLog.personName;
    if (updatedLog.sender !== undefined) supabaseUpdate.sender = updatedLog.sender;
    if (updatedLog.status !== undefined) supabaseUpdate.status = updatedLog.status;
    if (updatedLog.reasoning !== undefined) supabaseUpdate.reasoning = updatedLog.reasoning;
    if (updatedLog.schedule !== undefined) supabaseUpdate.schedule = updatedLog.schedule;
    if (updatedLog.timestamp !== undefined) supabaseUpdate.timestamp = updatedLog.timestamp;

    if (Object.keys(supabaseUpdate).length > 0) {
      const { error } = await supabase
        .from('logs')
        .update(supabaseUpdate)
        .eq('id', id);
      if (error) console.error('Error updating log:', error);
    }
  };

  const deleteLog = async (id: string) => {
    const newLogs = logs.filter(log => log.id !== id);
    setLogs(newLogs);
    const { error } = await supabase
      .from('logs')
      .delete()
      .eq('id', id);
    if (error) console.error('Error deleting log:', error);
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('hw_user');
    setIsLoaded(false);
  };

  return {
    user,
    authLoaded,
    signOut,
    config,
    saveConfig,
    logs,
    addLog,
    updateLog,
    deleteLog,
    isLoaded
  };
}
