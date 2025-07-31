/**
 * @file dashboardStore.ts
 * @description Zustand store for managing the dashboard's UI state.
 *
 * This store handles state that is local to the dashboard UI and not
 * persisted on the server, such as the visibility of the "Create Application"
 * modal. Using Zustand provides a simple and lightweight way to manage
 * global UI state without prop drilling.
 */

import { create } from 'zustand';

/**
 * @interface DashboardState
 * @description Defines the shape of the dashboard's state.
 *
 * @property {boolean} isModalOpen - Whether the "Create Application" modal is currently visible.
 * @property {() => void} openModal - A function to open the modal.
 * @property {() => void} closeModal - A function to close the modal.
 */
interface DashboardState {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

/**
 * @function useDashboardStore
 * @description A Zustand hook for accessing and managing the dashboard's state.
 *
 * This hook provides the state and actions defined in `DashboardState`.
 * Components can use this hook to interact with the shared dashboard UI state.
 *
 * @example
 * const { isModalOpen, openModal, closeModal } = useDashboardStore();
 */
export const useDashboardStore = create<DashboardState>((set) => ({
  isModalOpen: false,
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));
