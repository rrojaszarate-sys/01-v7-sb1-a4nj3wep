/**
 * Real-time Connection Validator
 * Monitors database connectivity and provides immediate feedback
 */

import React from 'react';
import { supabase } from '../lib/supabase';

export interface ConnectionStatus {
  isConnected: boolean;
  latency: number;
  lastChecked: string;
  error?: string;
}

export class ConnectionValidator {
  private static instance: ConnectionValidator;
  private status: ConnectionStatus = {
    isConnected: false,
    latency: 0,
    lastChecked: new Date().toISOString()
  };
  private listeners: ((status: ConnectionStatus) => void)[] = [];
  private checkInterval: number | null = null;

  static getInstance(): ConnectionValidator {
    if (!ConnectionValidator.instance) {
      ConnectionValidator.instance = new ConnectionValidator();
    }
    return ConnectionValidator.instance;
  }

  /**
   * Start monitoring connection
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.checkConnection();

    // Set up periodic checks
    this.checkInterval = window.setInterval(() => {
      this.checkConnection();
    }, intervalMs);
  }

  /**
   * Stop monitoring connection
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Add listener for connection status changes
   */
  addListener(callback: (status: ConnectionStatus) => void): void {
    this.listeners.push(callback);
    // Immediately call with current status
    callback(this.status);
  }

  /**
   * Remove listener
   */
  removeListener(callback: (status: ConnectionStatus) => void): void {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return { ...this.status };
  }

  /**
   * Perform connection check
   */
  private async checkConnection(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const { error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      const latency = Date.now() - startTime;

      if (error) {
        this.updateStatus({
          isConnected: false,
          latency,
          lastChecked: new Date().toISOString(),
          error: error.message
        });
      } else {
        this.updateStatus({
          isConnected: true,
          latency,
          lastChecked: new Date().toISOString()
        });
      }
    } catch (error) {
      const latency = Date.now() - startTime;
      this.updateStatus({
        isConnected: false,
        latency,
        lastChecked: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown connection error'
      });
    }
  }

  /**
   * Update status and notify listeners
   */
  private updateStatus(newStatus: ConnectionStatus): void {
    this.status = newStatus;
    this.listeners.forEach(listener => listener(newStatus));
  }

  /**
   * Force immediate connection check
   */
  async forceCheck(): Promise<ConnectionStatus> {
    await this.checkConnection();
    return this.getStatus();
  }
}

/**
 * React hook for connection monitoring
 */
export function useConnectionMonitor(autoStart: boolean = true) {
  const [status, setStatus] = React.useState<ConnectionStatus>({
    isConnected: false,
    latency: 0,
    lastChecked: new Date().toISOString()
  });

  React.useEffect(() => {
    const validator = ConnectionValidator.getInstance();
    
    const handleStatusChange = (newStatus: ConnectionStatus) => {
      setStatus(newStatus);
    };

    validator.addListener(handleStatusChange);

    if (autoStart) {
      validator.startMonitoring();
    }

    return () => {
      validator.removeListener(handleStatusChange);
      if (autoStart) {
        validator.stopMonitoring();
      }
    };
  }, [autoStart]);

  const forceCheck = React.useCallback(async () => {
    const validator = ConnectionValidator.getInstance();
    return await validator.forceCheck();
  }, []);

  return {
    status,
    forceCheck,
    isHealthy: status.isConnected && !status.error,
    latency: status.latency
  };
}