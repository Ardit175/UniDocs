// User Types
export interface User {
  id: number;
  email: string;
  role: 'student' | 'pedagogue' | 'admin';
  emri: string;
  mbiemri: string;
  foto_profili_url?: string;
  is_verified: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Student {
  id: number;
  user_id: number;
  student_id: string;
  emer_atit?: string;
  data_lindjes?: Date;
  vendlindja?: string;
  adresa?: string;
  telefoni?: string;
  program_id?: number;
  viti_studimit?: number;
  data_regjistrimit: Date;
  status: 'aktiv' | 'pasiv' | 'diplomuar';
}

export interface Pedagogue {
  id: number;
  user_id: number;
  pedagog_id: string;
  departamenti?: string;
  grada_akademike?: string;
  specializimi?: string;
}

// Program and Subject Types
export interface Program {
  id: number;
  emri_shqip: string;
  emri_anglisht: string;
  lloji: 'Bachelor' | 'Master' | 'PhD';
  kohezgjatja_vite?: number;
  total_kredite?: number;
  created_at: Date;
}

export interface Subject {
  id: number;
  kodi: string;
  emri_shqip: string;
  emri_anglisht: string;
  kredite: number;
  semestri_rekomandueshme?: number;
  program_id?: number;
  pedagog_id?: number;
  pershkrimi?: string;
  created_at: Date;
}

// Enrollment and Grade Types
export interface Enrollment {
  id: number;
  student_id: number;
  subject_id: number;
  viti_akademik: string;
  semestri: number;
  prezenca_perqindje?: number;
  created_at: Date;
}

export interface Grade {
  id: number;
  student_id: number;
  subject_id: number;
  nota: number;
  vleresimi?: string;
  data_provimit?: Date;
  viti_akademik: string;
  semestri: number;
  created_at: Date;
}

// Document Types
export interface Document {
  id: number;
  document_id_unique: string;
  document_type: DocumentType;
  generated_by_user_id: number;
  for_student_id?: number;
  file_path: string;
  qr_code_data?: string;
  language: 'sq' | 'en';
  status: 'valid' | 'revoked' | 'expired';
  download_count: number;
  generated_at: Date;
  expires_at?: Date;
}

export type DocumentType =
  | 'certificate-enrollment'
  | 'transcript'
  | 'certificate-participation'
  | 'certificate-completion'
  | 'student-verification';

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  emri: string;
  mbiemri: string;
  role: 'student' | 'pedagogue';
  student_id?: string;
  pedagog_id?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface DocumentGenerationRequest {
  language?: 'sq' | 'en';
  student_id?: number;
}

export interface DocumentGenerationResponse {
  document_id: string;
  download_url: string;
  expires_at?: Date;
}

// Statistics Types
export interface StudentStats {
  gpa: number;
  total_credits: number;
  completed_subjects: number;
  failed_subjects: number;
  completion_percentage: number;
}

export interface CourseStats {
  course_id: number;
  total_students: number;
  average_grade: number;
  passed: number;
  failed: number;
  grade_distribution: {
    excellent: number;
    very_good: number;
    good: number;
    satisfactory: number;
    unsatisfactory: number;
  };
}

// API Error Response
export interface ApiError {
  status: 'error';
  message: string;
  errors?: Record<string, string[]>;
}

// API Success Response
export interface ApiSuccess<T = any> {
  status: 'success';
  data: T;
  message?: string;
}
