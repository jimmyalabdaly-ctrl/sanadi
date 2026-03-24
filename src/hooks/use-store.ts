"use client";

import { create } from "zustand";

interface AppState {
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;
  searchQuery: string;
  selectedCity: string;
  notifications: number;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setSearchQuery: (query: string) => void;
  setSelectedCity: (city: string) => void;
  setNotifications: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  searchQuery: "",
  selectedCity: "",
  notifications: 0,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedCity: (city) => set({ selectedCity: city }),
  setNotifications: (count) => set({ notifications: count }),
}));
