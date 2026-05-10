import { create } from 'zustand';

type TimerState = {
  label: string;
  remainingSec: number;
  isRunning: boolean;
  isVisible: boolean;
  start: (label: string, seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  tick: () => void;
};

export const useTimerStore = create<TimerState>((set, get) => ({
  label: '조리 타이머',
  remainingSec: 0,
  isRunning: false,
  isVisible: false,
  start: (label, seconds) => set({ label, remainingSec: seconds, isRunning: true, isVisible: true }),
  pause: () => set({ isRunning: false }),
  resume: () => set({ isRunning: true }),
  stop: () => set({ isRunning: false, isVisible: false, remainingSec: 0 }),
  tick: () => {
    const { remainingSec, isRunning } = get();
    if (!isRunning || remainingSec <= 0) return;
    set({ remainingSec: remainingSec - 1 });
  },
}));
