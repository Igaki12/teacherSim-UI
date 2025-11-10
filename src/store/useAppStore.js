import { create } from 'zustand';

const initialSessionState = {
  started: false,
  trainingEnded: false,
  currentScenarioId: null,
  messages: [],
  scores: []
};

const useAppStore = create((set, get) => ({
  isAuthenticated: false,
  userName: '',
  currentViseme: 'neutral',
  ...initialSessionState,

  login: (userName = 'Guest') =>
    set({
      isAuthenticated: true,
      userName
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      userName: '',
      currentViseme: 'neutral',
      ...initialSessionState
    }),
  startScenario: (scenarioId) =>
    set({
      started: true,
      trainingEnded: false,
      currentScenarioId: scenarioId,
      messages: [],
      scores: []
    }),
  resetSession: () =>
    set({
      started: false,
      trainingEnded: false,
      currentScenarioId: null,
      messages: [],
      scores: []
    }),
  addMessage: (message) =>
    set({
      messages: [...get().messages, message]
    }),
  addScore: (score) =>
    set({
      scores: [...get().scores, score]
    }),
  endTraining: () =>
    set({
      trainingEnded: true
    }),
  setViseme: (viseme) =>
    set({
      currentViseme: viseme
    })
}));

export default useAppStore;
