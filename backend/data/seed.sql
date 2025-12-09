-- UniDocs Seed Data
-- Based on Bachelor in Computer Engineering curriculum 2023-2024

-- Clear existing data (in correct order to avoid foreign key constraints)
TRUNCATE TABLE verification_logs CASCADE;
TRUNCATE TABLE activity_logs CASCADE;
TRUNCATE TABLE documents CASCADE;
TRUNCATE TABLE grades CASCADE;
TRUNCATE TABLE enrollments CASCADE;
TRUNCATE TABLE subjects CASCADE;
TRUNCATE TABLE pedagogues CASCADE;
TRUNCATE TABLE students CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE programs CASCADE;

-- Reset sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE students_id_seq RESTART WITH 1;
ALTER SEQUENCE pedagogues_id_seq RESTART WITH 1;
ALTER SEQUENCE programs_id_seq RESTART WITH 1;
ALTER SEQUENCE subjects_id_seq RESTART WITH 1;
ALTER SEQUENCE enrollments_id_seq RESTART WITH 1;
ALTER SEQUENCE grades_id_seq RESTART WITH 1;
ALTER SEQUENCE documents_id_seq RESTART WITH 1;

-- Insert Programs
INSERT INTO programs (emri_shqip, emri_anglisht, lloji, kohezgjatja_vite, total_kredite) VALUES
('Inxhinieri Informatike', 'Computer Engineering', 'Bachelor', 3, 180),
('Inxhinieri e Softuerit', 'Software Engineering', 'Bachelor', 3, 180),
('Shkenca Kompjuterike', 'Computer Science', 'Bachelor', 3, 180),
('Sisteme Informacioni', 'Information Systems', 'Bachelor', 3, 180);

-- Insert Admin User
INSERT INTO users (email, password_hash, role, emri, mbiemri, is_verified) VALUES
('admin@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'admin', 'Admin', 'System', true);

-- Insert Pedagogues Users
INSERT INTO users (email, password_hash, role, emri, mbiemri, is_verified) VALUES
('andrea.maliqari@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'pedagogue', 'Andrea', 'Maliqari', true),
('elinda.mece@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'pedagogue', 'Elinda', 'Meçe', true),
('enida.sheme@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'pedagogue', 'Enida', 'Sheme', true),
('pedagog1@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'pedagogue', 'Pedagog', 'Test1', true),
('pedagog2@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'pedagogue', 'Pedagog', 'Test2', true);

-- Insert Pedagogues
INSERT INTO pedagogues (user_id, pedagog_id, departamenti, grada_akademike, specializimi) VALUES
(2, 'P001', 'Departamenti i Inxhinierisë Informatike', 'Prof. Dr.', 'Inxhinieri Informatike'),
(3, 'P002', 'Departamenti i Inxhinierisë Informatike', 'Prof. Dr.', 'Teknologji Informacioni'),
(4, 'P003', 'Departamenti i Inxhinierisë Informatike', 'Dr.', 'Sisteme Informacioni'),
(5, 'P004', 'Departamenti i Inxhinierisë Informatike', 'Prof. Asoc.', 'Bazat e të Dhënave'),
(6, 'P005', 'Departamenti i Inxhinierisë Informatike', 'Prof. Asoc.', 'Rrjeta Kompjuterike');

-- Insert Students Users
INSERT INTO users (email, password_hash, role, emri, mbiemri, is_verified) VALUES
('student1@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'student', 'Ardit', 'Hoxha', true),
('student2@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'student', 'Ela', 'Kola', true),
('student3@fti.edu.al', '$2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2', 'student', 'Andi', 'Dervishi', true);

-- Insert Students
INSERT INTO students (user_id, student_id, emer_atit, data_lindjes, vendlindja, adresa, telefoni, program_id, viti_studimit, status) VALUES
(7, 'S2021001', 'Genc', '2003-05-15', 'Tiranë', 'Rruga e Kavajës, Tiranë', '+355691234567', 1, 3, 'aktiv'),
(8, 'S2022002', 'Petrit', '2004-08-20', 'Durrës', 'Rruga Dëshmorët e Kombit, Durrës', '+355692345678', 1, 2, 'aktiv'),
(9, 'S2023003', 'Ilir', '2005-03-10', 'Vlorë', 'Rruga Ismail Qemali, Vlorë', '+355693456789', 1, 1, 'aktiv');

-- Insert Subjects - Year 1, Semester 1
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-101', 'Gjuhë e huaj 1', 'Foreign Language 1', 5, 1, 1, 1, 'Gjuhë e huaj për studentët e inxhinierisë informatike'),
('B-INF-102', 'Analizë Matematike 1', 'Mathematical Analysis 1', 6, 1, 1, 2, 'Bazat e analizës matematike'),
('B-INF-103', 'Fizikë 1', 'Physics 1', 5, 1, 1, 3, 'Fizika për inxhinierë'),
('B-INF-104', 'Elementet e Informatikës', 'Elements of Computer Science', 6, 1, 1, 4, 'Hyrje në shkencën kompjuterike'),
('B-INF-105', 'Algjebër dhe Gjeometri', 'Algebra and Geometry', 6, 1, 1, 5, 'Algjebra lineare dhe gjeometria analitike'),
('B-INF-106', 'Komunikime Inxhinierike', 'Engineering Communications', 4, 1, 1, 1, 'Komunikim teknik dhe shkencor');

-- Insert Subjects - Year 1, Semester 2
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-107', 'Analizë Matematike 2', 'Mathematical Analysis 2', 6, 2, 1, 2, 'Vazhdim i analizës matematike'),
('B-INF-108', 'Fizikë 2', 'Physics 2', 5, 2, 1, 3, 'Fizika 2 për inxhinierë'),
('B-INF-109', 'Elektroteknikë', 'Electrical Engineering', 5, 2, 1, 4, 'Bazat e elektroteknikës'),
('B-INF-110', 'Analizë Matematike 3', 'Mathematical Analysis 3', 3, 2, 1, 5, 'Analiza matematike avancuar'),
('B-INF-111', 'Teknikat dhe gjuhët e programimit', 'Programming Techniques and Languages', 6, 2, 1, 1, 'Programim me C/C++'),
('B-INF-112', 'Probabiliteti', 'Probability', 3, 2, 1, 2, 'Teoria e probabilitetit');

-- Insert Subjects - Year 2, Semester 3
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-202', 'Analizë numerike', 'Numerical Analysis', 3, 3, 1, 3, 'Metodat numerike në inxhinieri'),
('B-INF-203', 'Programimi i orientuar nga objekti', 'Object Oriented Programming', 6, 3, 1, 4, 'OOP me Java'),
('B-INF-204', 'Teoria e sinjaleve', 'Signal Theory', 6, 3, 1, 5, 'Përpunimi i sinjaleve'),
('B-INF-205', 'Bazat e të dhënave', 'Database Fundamentals', 6, 3, 1, 1, 'SQL dhe bazat relacionale'),
('B-INF-206', 'Automatizim', 'Automation', 5, 3, 1, 2, 'Sistemet e automatizuara'),
('B-INF-207', 'Elementet dhe teknologjitë elektronike', 'Electronic Elements and Technologies', 6, 3, 1, 3, 'Elektronika digjitale');

-- Insert Subjects - Year 2, Semester 4
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-208', 'Sistemet elektronike', 'Electronic Systems', 6, 4, 1, 4, 'Projektim i sistemeve elektronike'),
('B-INF-209', 'Përpunimi numerik i sinjaleve', 'Digital Signal Processing', 6, 4, 1, 5, 'DSP dhe aplikime'),
('B-INF-210', 'Matjet elektronike', 'Electronic Measurements', 4, 4, 1, 1, 'Instrumentacion dhe matje'),
('B-INF-211', 'Arkitekturë e kompjuterave', 'Computer Architecture', 6, 4, 1, 2, 'Organizimi i kompjuterit'),
('B-INF-212', 'Strukturë të dhënash', 'Data Structures', 6, 4, 1, 3, 'Strukturat e të dhënave dhe algoritmet');

-- Insert Subjects - Year 3, Semester 5
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-301', 'Algoritmikë', 'Algorithms', 6, 5, 1, 4, 'Algoritme dhe kompleksitet'),
('B-INF-302', 'Rrjetat e Kompjuterave', 'Computer Networks', 6, 5, 1, 5, 'Protokollet dhe rrjetat'),
('B-INF-303', 'Programim Web', 'Web Programming', 6, 5, 1, 1, 'HTML, CSS, JavaScript, React'),
('B-INF-304', 'Inxhinieri Softi', 'Software Engineering', 6, 5, 1, 2, 'Zhvillimi i softuerit'),
('B-INF-305', 'Sistemet Operative', 'Operating Systems', 6, 5, 1, 3, 'Linux, Windows, proceset'),
('B-INF-306', 'Teknikat e përpunimt të të dhënave në Python', 'Data Processing Techniques in Python', 6, 5, 1, 4, 'Python për shkencë të dhënash');

-- Insert Subjects - Year 3, Semester 6
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-307', 'Sistemet e shpërndara dhe reja kompjuterike', 'Distributed Systems and Computer Networks', 6, 6, 1, 5, 'Cloud computing dhe sistemet e shpërndara'),
('B-INF-308', 'Ekonomi dhe Menaxhim', 'Economics and Management', 5, 6, 1, 1, 'Menaxhim biznesi'),
('B-INF-309', 'Legjislacioni ne TIK', 'ICT Legislation', 3, 6, 1, 2, 'Ligjet në teknologjinë e informacionit');

-- Insert Optional Subjects
INSERT INTO subjects (kodi, emri_shqip, emri_anglisht, kredite, semestri_rekomandueshme, program_id, pedagog_id, pershkrimi) VALUES
('B-INF-E01', 'Bazat e Internet of Things (IoT)', 'IoT Fundamentals', 5, 6, 1, 3, 'Hyrje në IoT'),
('B-INF-E02', 'Menaxhim Projektesh TIK', 'ICT Project Management', 5, 6, 1, 4, 'Menaxhimi i projekteve IT'),
('B-INF-E03', 'Integrim Evropian', 'European Integration', 3, 6, 1, 5, 'Proceset e integrimit evropian');

-- Insert Enrollments for Student 1 (Year 3 - Semester 5)
INSERT INTO enrollments (student_id, subject_id, viti_akademik, semestri, prezenca_perqindje) VALUES
(1, 25, '2024-2025', 1, 95.5),
(1, 26, '2024-2025', 1, 92.0),
(1, 27, '2024-2025', 1, 88.5),
(1, 28, '2024-2025', 1, 90.0),
(1, 29, '2024-2025', 1, 93.5),
(1, 30, '2024-2025', 1, 87.0);

-- Insert Grades for Student 1 (Completed semesters)
-- Year 1, Semester 1
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(1, 1, 8.5, 'Shumë Mirë', '2022-01-20', '2021-2022', 1),
(1, 2, 7.0, 'Mirë', '2022-01-22', '2021-2022', 1),
(1, 3, 8.0, 'Shumë Mirë', '2022-01-25', '2021-2022', 1),
(1, 4, 9.0, 'Shkëlqyer', '2022-01-27', '2021-2022', 1),
(1, 5, 7.5, 'Mirë', '2022-01-30', '2021-2022', 1),
(1, 6, 8.5, 'Shumë Mirë', '2022-02-02', '2021-2022', 1);

-- Year 1, Semester 2
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(1, 7, 7.5, 'Mirë', '2022-06-15', '2021-2022', 2),
(1, 8, 8.0, 'Shumë Mirë', '2022-06-17', '2021-2022', 2),
(1, 9, 7.0, 'Mirë', '2022-06-20', '2021-2022', 2),
(1, 10, 8.5, 'Shumë Mirë', '2022-06-22', '2021-2022', 2),
(1, 11, 9.5, 'Shkëlqyer', '2022-06-25', '2021-2022', 2),
(1, 12, 8.0, 'Shumë Mirë', '2022-06-27', '2021-2022', 2);

-- Year 2, Semester 3
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(1, 13, 8.0, 'Shumë Mirë', '2023-01-18', '2022-2023', 1),
(1, 14, 9.0, 'Shkëlqyer', '2023-01-20', '2022-2023', 1),
(1, 15, 7.5, 'Mirë', '2023-01-23', '2022-2023', 1),
(1, 16, 9.5, 'Shkëlqyer', '2023-01-25', '2022-2023', 1),
(1, 17, 7.0, 'Mirë', '2023-01-28', '2022-2023', 1),
(1, 18, 8.5, 'Shumë Mirë', '2023-01-30', '2022-2023', 1);

-- Year 2, Semester 4
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(1, 19, 8.5, 'Shumë Mirë', '2023-06-12', '2022-2023', 2),
(1, 20, 9.0, 'Shkëlqyer', '2023-06-14', '2022-2023', 2),
(1, 21, 8.0, 'Shumë Mirë', '2023-06-16', '2022-2023', 2),
(1, 22, 9.5, 'Shkëlqyer', '2023-06-18', '2022-2023', 2),
(1, 23, 8.5, 'Shumë Mirë', '2023-06-20', '2022-2023', 2);

-- Insert Enrollments for Student 2 (Year 2 - Semester 4)
INSERT INTO enrollments (student_id, subject_id, viti_akademik, semestri, prezenca_perqindje) VALUES
(2, 19, '2024-2025', 1, 90.0),
(2, 20, '2024-2025', 1, 85.5),
(2, 21, '2024-2025', 1, 92.0),
(2, 22, '2024-2025', 1, 88.0),
(2, 23, '2024-2025', 1, 91.5);

-- Insert Grades for Student 2 (Year 1 and Year 2 Semester 3)
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(2, 1, 7.5, 'Mirë', '2023-01-20', '2022-2023', 1),
(2, 2, 8.0, 'Shumë Mirë', '2023-01-22', '2022-2023', 1),
(2, 3, 7.0, 'Mirë', '2023-01-25', '2022-2023', 1),
(2, 4, 8.5, 'Shumë Mirë', '2023-01-27', '2022-2023', 1),
(2, 5, 7.5, 'Mirë', '2023-01-30', '2022-2023', 1),
(2, 6, 8.0, 'Shumë Mirë', '2023-02-02', '2022-2023', 1),
(2, 7, 8.5, 'Shumë Mirë', '2023-06-15', '2022-2023', 2),
(2, 8, 7.5, 'Mirë', '2023-06-17', '2022-2023', 2),
(2, 9, 8.0, 'Shumë Mirë', '2023-06-20', '2022-2023', 2),
(2, 10, 7.0, 'Mirë', '2023-06-22', '2022-2023', 2),
(2, 11, 9.0, 'Shkëlqyer', '2023-06-25', '2022-2023', 2),
(2, 12, 8.5, 'Shumë Mirë', '2023-06-27', '2022-2023', 2),
(2, 13, 7.5, 'Mirë', '2024-01-18', '2023-2024', 1),
(2, 14, 8.5, 'Shumë Mirë', '2024-01-20', '2023-2024', 1),
(2, 15, 8.0, 'Shumë Mirë', '2024-01-23', '2023-2024', 1),
(2, 16, 9.0, 'Shkëlqyer', '2024-01-25', '2023-2024', 1),
(2, 17, 7.5, 'Mirë', '2024-01-28', '2023-2024', 1),
(2, 18, 8.0, 'Shumë Mirë', '2024-01-30', '2023-2024', 1);

-- Insert Enrollments for Student 3 (Year 1 - Semester 2)
INSERT INTO enrollments (student_id, subject_id, viti_akademik, semestri, prezenca_perqindje) VALUES
(3, 7, '2024-2025', 1, 88.5),
(3, 8, '2024-2025', 1, 90.0),
(3, 9, '2024-2025', 1, 85.0),
(3, 10, '2024-2025', 1, 92.5),
(3, 11, '2024-2025', 1, 94.0),
(3, 12, '2024-2025', 1, 89.5);

-- Insert Grades for Student 3 (Year 1 Semester 1)
INSERT INTO grades (student_id, subject_id, nota, vlerësimi, data_provimit, viti_akademik, semestri) VALUES
(3, 1, 8.0, 'Shumë Mirë', '2024-01-20', '2023-2024', 1),
(3, 2, 7.5, 'Mirë', '2024-01-22', '2023-2024', 1),
(3, 3, 8.5, 'Shumë Mirë', '2024-01-25', '2023-2024', 1),
(3, 4, 9.0, 'Shkëlqyer', '2024-01-27', '2023-2024', 1),
(3, 5, 8.0, 'Shumë Mirë', '2024-01-30', '2023-2024', 1),
(3, 6, 8.5, 'Shumë Mirë', '2024-02-02', '2023-2024', 1);

-- Insert System Settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_daily_document_generation', '10', 'Maximum documents per student per day'),
('document_validity_days', '365', 'Default document validity period in days'),
('system_name', 'UniDocs', 'System name'),
('institution_name', 'Universiteti Politeknik i Tiranës', 'Institution name'),
('faculty_name', 'Fakulteti i Teknologjisë së Informacionit', 'Faculty name'),
('department_name', 'Departamenti i Inxhinierisë Informatike', 'Department name'),
('academic_year_current', '2024-2025', 'Current academic year'),
('chairman_name', 'Prof. Dr. Andrea Maliqari', 'SAUPT Chairman'),
('dean_name', 'Prof. Dr. Elinda Meçe', 'Faculty Dean'),
('head_of_department', 'Dr. Enida Sheme', 'Head of Department');

-- Password for all test accounts: "Password123!"
-- Hash: $2b$10$M8g6l7jSjw9FbBFcXffjFuPhBvuQH2bNutWEGFLI5mJRAbqbmylg2
