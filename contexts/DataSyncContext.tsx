import React, { createContext, useContext, useCallback, useState } from 'react';

// Data sync events
export enum SyncEvent {
  TRANSACTION_CREATED = 'TRANSACTION_CREATED',
  TRANSACTION_UPDATED = 'TRANSACTION_UPDATED', 
  TRANSACTION_DELETED = 'TRANSACTION_DELETED',
  CATEGORY_CREATED = 'CATEGORY_CREATED',
  CATEGORY_UPDATED = 'CATEGORY_UPDATED',
  CATEGORY_DELETED = 'CATEGORY_DELETED',
  BUDGET_CREATED = 'BUDGET_CREATED',
  BUDGET_UPDATED = 'BUDGET_UPDATED',
  BUDGET_DELETED = 'BUDGET_DELETED',
}

interface DataSyncContextType {
  // Trigger sync events
  triggerSync: (event: SyncEvent, data?: any) => void;
  
  // Subscribe to sync events
  subscribe: (event: SyncEvent, callback: (data?: any) => void) => () => void;
  
  // Manual refresh triggers
  refreshTransactions: () => void;
  refreshCategories: () => void;
  refreshDashboard: () => void;
  refreshBudgets: () => void;
  
  // Refresh counters for components to track updates
  transactionRefreshKey: number;
  categoryRefreshKey: number;
  dashboardRefreshKey: number;
  budgetRefreshKey: number;
}

const DataSyncContext = createContext<DataSyncContextType | null>(null);

export function DataSyncProvider({ children }: { children: React.ReactNode }) {
  const [listeners, setListeners] = useState<Map<SyncEvent, Set<Function>>>(new Map());
  const [transactionRefreshKey, setTransactionRefreshKey] = useState(0);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0);
  const [budgetRefreshKey, setBudgetRefreshKey] = useState(0);

  const triggerSync = useCallback((event: SyncEvent, data?: any) => {
    console.log('Data sync event triggered:', event, data);
    
    // Notify all listeners for this event
    const eventListeners = listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in sync listener:', error);
        }
      });
    }
    
    // Update appropriate refresh keys
    switch (event) {
      case SyncEvent.TRANSACTION_CREATED:
      case SyncEvent.TRANSACTION_UPDATED:
      case SyncEvent.TRANSACTION_DELETED:
        setTransactionRefreshKey(prev => prev + 1);
        setDashboardRefreshKey(prev => prev + 1);
        break;
        
      case SyncEvent.CATEGORY_CREATED:
      case SyncEvent.CATEGORY_UPDATED:
      case SyncEvent.CATEGORY_DELETED:
        setCategoryRefreshKey(prev => prev + 1);
        setDashboardRefreshKey(prev => prev + 1);
        setTransactionRefreshKey(prev => prev + 1);
        break;
        
      case SyncEvent.BUDGET_CREATED:
      case SyncEvent.BUDGET_UPDATED:
      case SyncEvent.BUDGET_DELETED:
        setBudgetRefreshKey(prev => prev + 1);
        setDashboardRefreshKey(prev => prev + 1);
        break;
    }
  }, [listeners]);

  const subscribe = useCallback((event: SyncEvent, callback: (data?: any) => void) => {
    setListeners(prev => {
      const newListeners = new Map(prev);
      const eventListeners = newListeners.get(event) || new Set();
      eventListeners.add(callback);
      newListeners.set(event, eventListeners);
      return newListeners;
    });
    
    // Return unsubscribe function
    return () => {
      setListeners(prev => {
        const newListeners = new Map(prev);
        const eventListeners = newListeners.get(event);
        if (eventListeners) {
          eventListeners.delete(callback);
          if (eventListeners.size === 0) {
            newListeners.delete(event);
          }
        }
        return newListeners;
      });
    };
  }, []);

  const refreshTransactions = useCallback(() => {
    triggerSync(SyncEvent.TRANSACTION_CREATED);
  }, [triggerSync]);

  const refreshCategories = useCallback(() => {
    triggerSync(SyncEvent.CATEGORY_CREATED);
  }, [triggerSync]);

  const refreshDashboard = useCallback(() => {
    triggerSync(SyncEvent.BUDGET_CREATED);
  }, [triggerSync]);

  const refreshBudgets = useCallback(() => {
    triggerSync(SyncEvent.BUDGET_CREATED);
  }, [triggerSync]);

  const value: DataSyncContextType = {
    triggerSync,
    subscribe,
    refreshTransactions,
    refreshCategories,
    refreshDashboard,
    refreshBudgets,
    transactionRefreshKey,
    categoryRefreshKey,
    dashboardRefreshKey,
    budgetRefreshKey,
  };

  return (
    <DataSyncContext.Provider value={value}>
      {children}
    </DataSyncContext.Provider>
  );
}

export function useDataSync() {
  const context = useContext(DataSyncContext);
  if (!context) {
    throw new Error('useDataSync must be used within DataSyncProvider');
  }
  return context;
}
