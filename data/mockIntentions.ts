import { Intention } from '@/types/canvas';

export const mockIntentions: Intention[] = [
  {
    id: 'int-001',
    title: 'Become a teacher',
    description: 'Train and qualify as a secondary school teacher after graduation.',
    bucket: 'after-graduation',
    steps: [
      { id: 'step-001', intentionId: 'int-001', title: 'Shadow a teacher for a day', bucket: 'do-now', order: 1 },
      { id: 'step-002', intentionId: 'int-001', title: 'Volunteer at a local school', bucket: 'do-later', order: 2 },
      { id: 'step-003', intentionId: 'int-001', title: 'Apply for teaching internship', bucket: 'before-graduation', order: 3 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-002',
    title: 'Make friends on my course',
    description: 'Build a sense of community and belonging early in my degree.',
    bucket: 'do-later',
    steps: [
      { id: 'step-004', intentionId: 'int-002', title: 'Join a society taster session', bucket: 'do-now', order: 1 },
      { id: 'step-005', intentionId: 'int-002', title: 'Organise a study group', bucket: 'do-now', order: 2 },
      { id: 'step-006', intentionId: 'int-002', title: 'Plan a course social', bucket: 'do-now', order: 3 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'int-003',
    title: 'Achieve a sandwich placement',
    description: 'Secure a year-long industry placement before my final year.',
    bucket: 'before-graduation',
    steps: [
      { id: 'step-007', intentionId: 'int-003', title: 'Update CV and cover letter', bucket: 'do-now', order: 1 },
      { id: 'step-008', intentionId: 'int-003', title: 'Attend internship networking event', bucket: 'do-later', order: 2 },
      { id: 'step-009', intentionId: 'int-003', title: 'Submit placement applications', bucket: 'do-later', order: 3 }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];
