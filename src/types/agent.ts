
export interface FormData {
  fullName: string;
  email: string;
  isCompany: boolean;
  url: string;
  useCase: string;
  voiceStyle: string;
}

export interface ConversationScenario {
  id?: string;
  scenario: string;
  userInputs: string[];
  responses: string[];
  followUps: string[];
  nextScenarioId?: string;
  conditions?: string;
}
