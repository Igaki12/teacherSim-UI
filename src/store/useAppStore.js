import { create } from 'zustand';

const initialSessionState = {
  started: false,
  trainingEnded: false,
  currentScenarioId: null,
  messages: [],
  scores: [],
  visemeWeights: {},
  chatInput: '',
  isChatSending: false,
  isChatRecording: false
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
      ...initialSessionState,
      started: true,
      trainingEnded: false,
      currentScenarioId: scenarioId
    }),
  resetSession: () =>
    set({
      ...initialSessionState
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
  setViseme: (viseme, weight = 1) =>
    set((state) => ({
      currentViseme: viseme,
      visemeWeights: {
        ...state.visemeWeights,
        [viseme]: weight
      }
    })),
  setChatInput: (value) =>
    set({
      chatInput: value
    }),
  setChatSending: (value) =>
    set({
      isChatSending: value
    }),
  toggleChatRecording: () =>
    set((state) => ({
      isChatRecording: !state.isChatRecording
    }))
}));

export default useAppStore;
