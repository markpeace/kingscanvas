import { Intention } from '@/types/canvas';

export const mockIntentions: Intention[] = [
  {
    id: 'int-001',
    title: 'Become a teacher',
    description: 'Explore education career paths and gain experience.',
    bucket: 'do-now',
    steps: [
      { id: 'step-001', intentionId: 'int-001', title: 'Volunteer in a local school', bucket: 'do-now', order: 1 },
      { id: 'step-002', intentionId: 'int-001', title: 'Attend teaching taster event', bucket: 'do-later', order: 2 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-002',
    title: 'Study abroad',
    description: 'Research semester-abroad options for next year.',
    bucket: 'do-later',
    steps: [
      { id: 'step-003', intentionId: 'int-002', title: 'Meet study-abroad advisor', bucket: 'do-now', order: 1 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-003',
    title: 'Start a small business',
    description: 'Explore entrepreneurship opportunities after graduation.',
    bucket: 'after-graduation',
    steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
