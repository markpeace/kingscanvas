export interface Step {
  id: string;
  intentionId: string;
  title: string;
  bucket: 'do-now' | 'do-later' | 'before-graduation' | 'after-graduation';
  order: number;
}

export interface Intention {
  id: string;
  title: string;
  description?: string;
  steps: Step[];
  createdAt: string;
  updatedAt: string;
}
