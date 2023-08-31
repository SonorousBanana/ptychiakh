// RefreshContext.js
import React, { createContext, useContext, useState } from 'react';

const RefreshContext = createContext();

export const useRefreshContext = () => {
  return useContext(RefreshContext);
};

export const RefreshProvider = ({ children }) => {
  const [refreshFlag, setRefreshFlag] = useState(false);

  const triggerRefresh = () => {
    setRefreshFlag(prevFlag => !prevFlag);
  };

  return (
    <RefreshContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};
