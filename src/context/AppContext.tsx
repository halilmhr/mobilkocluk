import React, { createContext, useContext, ReactNode } from 'react';
import useAppDataWithSupabase from '../hooks/useAppDataWithSupabase';

type AppContextType = ReturnType<typeof useAppDataWithSupabase>;

const AppContext = createContext<AppContextType | null>(null);

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const appData = useAppDataWithSupabase();

    return (
        <AppContext.Provider value={appData}>
            {children}
        </AppContext.Provider>
    );
};
