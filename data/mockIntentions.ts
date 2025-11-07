import { Intention } from '@/types/canvas';

export const mockIntentions: Intention[] = [
  {
    id: 'int-001',
    title: 'Explore teaching career',
    description: 'Understand if teaching is the right path.',
    bucket: 'do-later',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-001',
        intentionId: 'int-001',
        title: 'Shadow a teacher for a day',
        bucket: 'do-now',
        order: 1
      }
    ]
  },
  {
    id: 'int-002',
    title: 'Secure an internship',
    description: 'Gain practical experience before graduating.',
    bucket: 'before-graduation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-002',
        intentionId: 'int-002',
        title: 'Update CV and cover letter',
        bucket: 'do-now',
        order: 1
      },
      {
        id: 'step-003',
        intentionId: 'int-002',
        title: 'Attend internship networking event',
        bucket: 'do-later',
        order: 2
      }
    ]
  },
  {
    id: 'int-003',
    title: 'Plan postgraduate study',
    description: 'Prepare for life after graduation.',
    bucket: 'after-graduation',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    steps: [
      {
        id: 'step-004',
        intentionId: 'int-003',
        title: 'Research postgraduate programmes',
        bucket: 'do-now',
        order: 1
      },
      {
        id: 'step-005',
        intentionId: 'int-003',
        title: 'Meet with academic advisor',
        bucket: 'do-later',
        order: 2
      },
      {
        id: 'step-006',
        intentionId: 'int-003',
        title: 'Prepare funding options',
        bucket: 'before-graduation',
        order: 3
      }
    ]
  }
];
