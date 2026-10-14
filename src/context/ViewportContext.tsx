import React, { createContext, useContext, useState } from 'react';

export type ViewportMode = 'responsive' | 'mobile_390' | 'desktop_1440';

interface ViewportContextType {
  mode: ViewportMode;
  setMode: (mode: ViewportMode) => void;
}

const ViewportContext = createContext<ViewportContextType>({
  mode: 'responsive',
  setMode: () => {},
});

export const ViewportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ViewportMode>('responsive');

  return (
    <ViewportContext.Provider value={{ mode, setMode }}>
      {children}
    </ViewportContext.Provider>
  );
};

export const useViewport = () => useContext(ViewportContext);
