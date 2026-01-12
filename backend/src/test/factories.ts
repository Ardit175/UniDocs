// Simple mock data generators without external dependencies

export interface MockUser {
  id: number;
  email: string;
  password: string;
  password_hash: string;
  role: 'student' | 'pedagogue' | 'admin';
  emri: string;
  mbiemri: string;
  is_verified: boolean;
  created_at: Date;
}

export interface MockStudent {
  id: number;
  user_id: number;
  student_id: string;
  program_id: number;
  status: string;
  created_at: Date;
}

export interface MockPedagogue {
  id: number;
  user_id: number;
  pedagog_id: string;
  department: string;
  created_at: Date;
}

export interface MockProgram {
  id: number;
  emri_shqip: string;
  emri_anglisht: string;
  lloji: string;
  kohezgjatja_vite: number;
  total_kredite: number;
}

export interface MockDocument {
  id: string;
  student_id: number;
  document_type: string;
  status: string;
  file_url: string;
  generated_at: Date;
  expires_at?: Date;
}

// Helper functions
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomUUID = (): string => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.random() * 16 | 0;
  const v = c === 'x' ? r : (r & 0x3 | 0x8);
  return v.toString(16);
});

const firstNames = ['Andi', 'Besa', 'Dritan', 'Elira', 'Fatmir', 'Genta', 'Hana', 'Ilir'];
const lastNames = ['Hoxha', 'Kelmendi', 'Leka', 'Malaj', 'Nikolla', 'Osmani', 'Prifti', 'Rama'];

/**
 * Create a mock user with realistic data
 */
export const createMockUser = (overrides?: Partial<MockUser>): MockUser => {
  const firstName = randomElement(firstNames);
  const lastName = randomElement(lastNames);
  const role = overrides?.role || randomElement(['student', 'pedagogue', 'admin'] as const);
  
  return {
    id: randomInt(1, 10000),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fti.edu.al`,
    password: 'Password123!',
    password_hash: '$2b$10$fakehashforpassword123',
    role,
    emri: firstName,
    mbiemri: lastName,
    is_verified: true,
    created_at: new Date(),
    ...overrides,
  };
};

/**
 * Create a mock student
 */
export const createMockStudent = (overrides?: Partial<MockStudent>): MockStudent => {
  return {
    id: randomInt(1, 10000),
    user_id: randomInt(1, 10000),
    student_id: `STU${randomInt(100000, 999999)}`,
    program_id: randomInt(1, 10),
    status: 'active',
    created_at: new Date(),
    ...overrides,
  };
};

/**
 * Create a mock pedagogue
 */
export const createMockPedagogue = (overrides?: Partial<MockPedagogue>): MockPedagogue => {
  return {
    id: randomInt(1, 10000),
    user_id: randomInt(1, 10000),
    pedagog_id: `PED${randomInt(100000, 999999)}`,
    department: randomElement(['Computer Science', 'Mathematics', 'Physics', 'Engineering']),
    created_at: new Date(),
    ...overrides,
  };
};

/**
 * Create a mock program
 */
export const createMockProgram = (overrides?: Partial<MockProgram>): MockProgram => {
  const programs = [
    { shqip: 'Inxhinieri Kompjuterike', anglisht: 'Computer Engineering' },
    { shqip: 'Shkenca Kompjuterike', anglisht: 'Computer Science' },
    { shqip: 'Inxhinieri Elektronike', anglisht: 'Electronic Engineering' },
    { shqip: 'Matematikë', anglisht: 'Mathematics' },
  ];
  
  const program = randomElement(programs);
  const lloji = randomElement(['Bachelor', 'Master']);
  
  return {
    id: randomInt(1, 50),
    emri_shqip: program.shqip,
    emri_anglisht: program.anglisht,
    lloji,
    kohezgjatja_vite: lloji === 'Bachelor' ? 3 : 2,
    total_kredite: lloji === 'Bachelor' ? 180 : 120,
    ...overrides,
  };
};

/**
 * Create a mock document
 */
export const createMockDocument = (overrides?: Partial<MockDocument>): MockDocument => {
  const docTypes = ['enrollment_certificate', 'transcript', 'participation_certificate', 'verification_letter'];
  
  return {
    id: randomUUID(),
    student_id: randomInt(1, 10000),
    document_type: randomElement(docTypes),
    status: randomElement(['pending', 'approved', 'rejected']),
    file_url: `https://minio.example.com/documents/${randomUUID()}.pdf`,
    generated_at: new Date(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    ...overrides,
  };
};

/**
 * Create multiple mock users
 */
export const createMockUsers = (count: number, overrides?: Partial<MockUser>): MockUser[] => {
  return Array.from({ length: count }, () => createMockUser(overrides));
};

/**
 * Create multiple mock students
 */
export const createMockStudents = (count: number, overrides?: Partial<MockStudent>): MockStudent[] => {
  return Array.from({ length: count }, () => createMockStudent(overrides));
};

/**
 * Create multiple mock documents
 */
export const createMockDocuments = (count: number, overrides?: Partial<MockDocument>): MockDocument[] => {
  return Array.from({ length: count }, () => createMockDocument(overrides));
};
