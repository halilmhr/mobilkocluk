import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PremiumContextType {
    isPremium: boolean;
    setIsPremium: (value: boolean) => void;
    showUpgradeModal: () => void;
    hideUpgradeModal: () => void;
    isUpgradeModalVisible: boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
    children: ReactNode;
}

export const PremiumProvider: React.FC<PremiumProviderProps> = ({ children }) => {
    // Unified premium experience for all users
    const [isPremium, setIsPremium] = useState(true);
    const [isUpgradeModalVisible, setIsUpgradeModalVisible] = useState(false);

    const showUpgradeModal = () => setIsUpgradeModalVisible(true);
    const hideUpgradeModal = () => setIsUpgradeModalVisible(false);

    return (
        <PremiumContext.Provider
            value={{
                isPremium,
                setIsPremium,
                showUpgradeModal,
                hideUpgradeModal,
                isUpgradeModalVisible,
            }}
        >
            {children}
        </PremiumContext.Provider>
    );
};

export const usePremium = (): PremiumContextType => {
    const context = useContext(PremiumContext);
    if (!context) {
        throw new Error('usePremium must be used within a PremiumProvider');
    }
    return context;
};
