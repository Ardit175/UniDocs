export interface User {
  id: number;
  email: string;
  role: 'student' | 'pedagogue' | 'admin';
  emri: string;
  mbiemri: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'student' | 'pedagogue' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
