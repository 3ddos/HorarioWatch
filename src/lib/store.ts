"use client";

import { useEffect, useState } from "react";

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
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem("horariowatch_config");
    const savedLogs = localStorage.getItem("horariowatch_logs");

    if (savedConfig) setConfig(JSON.parse(savedConfig));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
    setIsLoaded(true);
  }, []);

  const saveConfig = (newConfig: Config) => {
    setConfig(newConfig);
    localStorage.setItem("horariowatch_config", JSON.stringify(newConfig));
  };

  const addLog = (log: ProcessingLog) => {
    const newLogs = [log, ...logs].slice(0, 50); // Keep last 50
    setLogs(newLogs);
    localStorage.setItem("horariowatch_logs", JSON.stringify(newLogs));
  };

  const updateLog = (id: string, updatedLog: Partial<ProcessingLog>) => {
    const newLogs = logs.map(log => log.id === id ? { ...log, ...updatedLog } : log);
    setLogs(newLogs);
    localStorage.setItem("horariowatch_logs", JSON.stringify(newLogs));
  };

  const deleteLog = (id: string) => {
    const newLogs = logs.filter(log => log.id !== id);
    setLogs(newLogs);
    localStorage.setItem("horariowatch_logs", JSON.stringify(newLogs));
  };

  return { config, saveConfig, logs, addLog, updateLog, deleteLog, isLoaded };
}
