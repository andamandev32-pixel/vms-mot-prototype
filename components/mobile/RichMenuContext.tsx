"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface RichMenuContextType {
    isMenuOpen: boolean;
    toggleMenu: () => void;
}

const RichMenuContext = createContext<RichMenuContextType>({
    isMenuOpen: true,
    toggleMenu: () => {},
});

export function RichMenuProvider({ children }: { children: ReactNode }) {
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    return (
        <RichMenuContext.Provider value={{ isMenuOpen, toggleMenu: () => setIsMenuOpen((v) => !v) }}>
            {children}
        </RichMenuContext.Provider>
    );
}

export function useRichMenu() {
    return useContext(RichMenuContext);
}
