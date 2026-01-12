import { faker } from '@faker-js/faker';

/**
 * Frontend test data factories
 */

export interface MockAuthUser {
  id: number;
  email: string;
  role: 'student' | 'pedagogue' | 'admin';
  emri: string;
  mbiemri: string;
  token: string;
}

export interface MockLoginResponse {
  user: MockAuthUser;
  token: string;
}

export const createMockAuthUser = (overrides?: Partial<MockAuthUser>): MockAuthUser => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  
  return {
    id: faker.number.int({ min: 1, max: 10000 }),
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@fti.edu.al`,
    role: faker.helpers.arrayElement(['student', 'pedagogue', 'admin']),
    emri: firstName,
    mbiemri: lastName,
    token: `mock.jwt.token.${faker.string.alphanumeric(20)}`,
    ...overrides,
  };
};

export const createMockLoginResponse = (overrides?: Partial<MockLoginResponse>): MockLoginResponse => {
  const user = createMockAuthUser(overrides?.user);
  
  return {
    user,
    token: user.token,
    ...overrides,
  };
};

export const createMockProgram = () => {
  const programs = [
    { emri_shqip: 'Inxhinieri Kompjuterike', emri_anglisht: 'Computer Engineering' },
    { emri_shqip: 'Shkenca Kompjuterike', emri_anglisht: 'Computer Science' },
    { emri_shqip: 'Inxhinieri Elektronike', emri_anglisht: 'Electronic Engineering' },
  ];
  
  const program = faker.helpers.arrayElement(programs);
  
  return {
    id: faker.number.int({ min: 1, max: 50 }),
    emri_shqip: program.emri_shqip,
    emri_anglisht: program.emri_anglisht,
    lloji: 'Bachelor',
    kohezgjatja_vite: 3,
    total_kredite: 180,
  };
};
