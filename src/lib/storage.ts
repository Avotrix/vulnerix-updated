// Local storage utilities for Vulnerix

import { User, TechStack, Advisory, mockAdvisories, mockTechStacks } from './mockData';

const KEYS = {
  USER: 'vulnerix_user',
  TECH_STACKS: 'vulnerix_tech_stacks',
  ADVISORIES: 'vulnerix_advisories',
  EMAIL_QUEUE: 'vulnerix_email_queue',
  HAS_VISITED: 'vulnerix_has_visited',
  TOUR_COMPLETED: 'vulnerix_tour_completed'
};

// User management
export const getUser = (): User | null => {
  const data = localStorage.getItem(KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const setUser = (user: User): void => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
};

export const removeUser = (): void => {
  localStorage.removeItem(KEYS.USER);
};

// Has visited (for landing page logic)
export const hasVisited = (): boolean => {
  return localStorage.getItem(KEYS.HAS_VISITED) === 'true';
};

export const setHasVisited = (): void => {
  localStorage.setItem(KEYS.HAS_VISITED, 'true');
};

// Tour completed
export const hasTourCompleted = (): boolean => {
  return localStorage.getItem(KEYS.TOUR_COMPLETED) === 'true';
};

export const setTourCompleted = (): void => {
  localStorage.setItem(KEYS.TOUR_COMPLETED, 'true');
};

// Tech stacks
export const getTechStacks = (): TechStack[] => {
  const data = localStorage.getItem(KEYS.TECH_STACKS);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with mock data
  localStorage.setItem(KEYS.TECH_STACKS, JSON.stringify(mockTechStacks));
  return mockTechStacks;
};

export const setTechStacks = (stacks: TechStack[]): void => {
  localStorage.setItem(KEYS.TECH_STACKS, JSON.stringify(stacks));
};

export const addTechStack = (stack: Omit<TechStack, 'id' | 'uploadedAt'>): TechStack => {
  const stacks = getTechStacks();
  const newStack: TechStack = {
    ...stack,
    id: crypto.randomUUID(),
    uploadedAt: new Date().toISOString()
  };
  stacks.push(newStack);
  setTechStacks(stacks);
  return newStack;
};

export const updateTechStack = (id: string, updates: Partial<TechStack>): void => {
  const stacks = getTechStacks();
  const index = stacks.findIndex(s => s.id === id);
  if (index !== -1) {
    stacks[index] = { ...stacks[index], ...updates };
    setTechStacks(stacks);
  }
};

export const deleteTechStack = (id: string): void => {
  const stacks = getTechStacks();
  setTechStacks(stacks.filter(s => s.id !== id));
};

// Advisories
export const getAdvisories = (): Advisory[] => {
  const data = localStorage.getItem(KEYS.ADVISORIES);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with mock data
  localStorage.setItem(KEYS.ADVISORIES, JSON.stringify(mockAdvisories));
  return mockAdvisories;
};

export const setAdvisories = (advisories: Advisory[]): void => {
  localStorage.setItem(KEYS.ADVISORIES, JSON.stringify(advisories));
};

// Email queue (mock)
export interface EmailQueueItem {
  id: string;
  advisoryId: string;
  emailTo: string;
  status: 'queued' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

export const getEmailQueue = (): EmailQueueItem[] => {
  const data = localStorage.getItem(KEYS.EMAIL_QUEUE);
  return data ? JSON.parse(data) : [];
};

export const addToEmailQueue = (advisoryId: string, emailTo: string): EmailQueueItem => {
  const queue = getEmailQueue();
  const item: EmailQueueItem = {
    id: crypto.randomUUID(),
    advisoryId,
    emailTo,
    status: 'queued',
    createdAt: new Date().toISOString()
  };
  queue.push(item);
  localStorage.setItem(KEYS.EMAIL_QUEUE, JSON.stringify(queue));
  
  // Simulate email sending after 2 seconds
  setTimeout(() => {
    const currentQueue = getEmailQueue();
    const itemIndex = currentQueue.findIndex(q => q.id === item.id);
    if (itemIndex !== -1) {
      currentQueue[itemIndex].status = 'sent';
      currentQueue[itemIndex].sentAt = new Date().toISOString();
      localStorage.setItem(KEYS.EMAIL_QUEUE, JSON.stringify(currentQueue));
    }
  }, 2000);
  
  return item;
};

// Statistics
export const getStats = () => {
  const advisories = getAdvisories();
  const techStacks = getTechStacks();
  
  return {
    totalProducts: techStacks.length,
    critical: advisories.filter(a => a.Severity === 'Critical').length,
    high: advisories.filter(a => a.Severity === 'High').length,
    medium: advisories.filter(a => a.Severity === 'Medium').length,
    low: advisories.filter(a => a.Severity === 'Low').length,
    totalAdvisories: advisories.length
  };
};
