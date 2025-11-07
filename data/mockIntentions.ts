import { Intention } from '@/types/canvas';

export const mockIntentions: Intention[] = [
  {
    id: 'int-001',
    title: 'Become a teacher',
    description: 'Explore education career paths and gain experience.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-001',
        intentionId: 'int-001',
        title: 'Volunteer in a local school',
        bucket: 'do-now',
        order: 1
      },
      {
        id: 'step-002',
        intentionId: 'int-001',
        title: 'Attend teaching taster event',
        bucket: 'do-later',
        order: 2
      }
    ]
  }
];
