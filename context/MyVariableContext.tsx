// /context/MyVariableContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Project {
  project_id: string;
  project_name: string;
  project_type: string;
  group: string;
}

interface Group {
  group_id: string;
  group_name: string;
  logo_url: string;
  projects: Project[];
}

type MyVariable = {
  groupInfo: Group[];
  projectInfo?: any;
  budgetInfo?: any;
  transactions?: any;
  transactionInfo?: any;
  report?: any;
  stake_addr: string;
  csvDoc: any;
  gitHubTxs: any;
  databaseTxs: any;
  txidToFileMap: any;
  // other keys go here
};

interface MyVariableContextProps {
  myVariable: MyVariable;
  setMyVariable: React.Dispatch<React.SetStateAction<MyVariable>>;
}

export const MyVariableContext = createContext<MyVariableContextProps | undefined>(undefined);

interface MyVariableProviderProps {
  children: ReactNode;
}

export const MyVariableProvider: React.FC<MyVariableProviderProps> = ({ children }) => {
  const [myVariable, setMyVariable] = useState<MyVariable>({ groupInfo: [], projectInfo: undefined, budgetInfo: undefined, transactions: undefined, transactionInfo: undefined, report: undefined, stake_addr: '', csvDoc: undefined, gitHubTxs: undefined, databaseTxs: undefined, txidToFileMap: undefined });

  return (
    <MyVariableContext.Provider value={{ myVariable, setMyVariable }}>
      {children}
    </MyVariableContext.Provider>
  );
};

export const useMyVariable = (): MyVariableContextProps => {
  const context = useContext(MyVariableContext);
  if (!context) {
    throw new Error("useMyVariable must be used within a MyVariableProvider");
  }
  return context;
}
