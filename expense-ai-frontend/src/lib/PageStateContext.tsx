'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface PageStateContextType {
  isLoading: boolean;
  isError: boolean;
  setIsLoading: (loading: boolean) => void;
  setIsError: (error: boolean) => void;
}

const PageStateContext = createContext<PageStateContextType | undefined>(undefined);

export function PageStateProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  return (
    <PageStateContext.Provider value={{ isLoading, isError, setIsLoading, setIsError }}>
      {children}
    </PageStateContext.Provider>
  );
}

export function usePageState() {
  const context = useContext(PageStateContext);
  if (!context) {
    return { isLoading: false, isError: false, setIsLoading: () => {}, setIsError: () => {} };
  }
  return context;
}
