-- UniDocs Database Schema
-- PostgreSQL 15+

-- Users table (base table for all users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL CHECK (email LIKE '%@fti.edu.al'),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'pedagogue', 'admin')),
    emri VARCHAR(100) NOT NULL,
    mbiemri VARCHAR(100) NOT NULL,
    foto_profili_url VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    emer_atit VARCHAR(100),
    data_lindjes DATE,
    vendlindja VARCHAR(100),
    adresa VARCHAR(255),
    telefoni VARCHAR(20),
    program_id INTEGER,
    viti_studimit INTEGER CHECK (viti_studimit BETWEEN 1 AND 4),
    data_regjistrimit DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'aktiv' CHECK (status IN ('aktiv', 'pasiv', 'diplomuar'))
);

-- Pedagogues table
CREATE TABLE IF NOT EXISTS pedagogues (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pedagog_id VARCHAR(50) UNIQUE NOT NULL,
    departamenti VARCHAR(100),
    grada_akademike VARCHAR(50),
    specializimi VARCHAR(100)
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
    id SERIAL PRIMARY KEY,
    emri_shqip VARCHAR(200) NOT NULL,
    emri_anglisht VARCHAR(200) NOT NULL,
    lloji VARCHAR(50) CHECK (lloji IN ('Bachelor', 'Master', 'PhD')),
    kohezgjatja_vite INTEGER,
    total_kredite INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    kodi VARCHAR(20) UNIQUE NOT NULL,
    emri_shqip VARCHAR(200) NOT NULL,
    emri_anglisht VARCHAR(200) NOT NULL,
    kredite INTEGER NOT NULL CHECK (kredite > 0),
    semestri_rekomandueshme INTEGER CHECK (semestri_rekomandueshme BETWEEN 1 AND 8),
    program_id INTEGER REFERENCES programs(id),
    pedagog_id INTEGER REFERENCES pedagogues(id),
    pershkrimi TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    viti_akademik VARCHAR(20) NOT NULL,
    semestri INTEGER CHECK (semestri BETWEEN 1 AND 2),
    prezenca_perqindje DECIMAL(5,2) CHECK (prezenca_perqindje BETWEEN 0 AND 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, viti_akademik, semestri)
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    nota DECIMAL(4,2) CHECK (nota BETWEEN 0 AND 10),
    vlerësimi VARCHAR(50),
    data_provimit DATE,
    viti_akademik VARCHAR(20) NOT NULL,
    semestri INTEGER CHECK (semestri BETWEEN 1 AND 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, viti_akademik, semestri)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    document_id_unique VARCHAR(100) UNIQUE NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    generated_by_user_id INTEGER NOT NULL REFERENCES users(id),
    for_student_id INTEGER REFERENCES students(id),
    file_path VARCHAR(500) NOT NULL,
    qr_code_data TEXT,
    language VARCHAR(5) DEFAULT 'sq' CHECK (language IN ('sq', 'en')),
    status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'expired')),
    download_count INTEGER DEFAULT 0,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- Verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
    id SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES documents(id),
    ip_address VARCHAR(50),
    user_agent TEXT,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_pedagogues_user_id ON pedagogues(user_id);
CREATE INDEX idx_subjects_kodi ON subjects(kodi);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_subject ON enrollments(subject_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_subject ON grades(subject_id);
CREATE INDEX idx_documents_unique ON documents(document_id_unique);
CREATE INDEX idx_documents_student ON documents(for_student_id);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);

-- Insert sample programs
INSERT INTO programs (name, code, faculty, degree_level, duration_years, academic_year) VALUES
('Computer Engineering', 'CE', 'Fakulteti i Teknologjisë së Informacionit', 'Bachelor', 3, '2024-2025'),
('Software Engineering', 'SE', 'Fakulteti i Teknologjisë së Informacionit', 'Bachelor', 3, '2024-2025'),
('Computer Science', 'CS', 'Fakulteti i Teknologjisë së Informacionit', 'Bachelor', 3, '2024-2025'),
('Information Systems', 'IS', 'Fakulteti i Teknologjisë së Informacionit', 'Bachelor', 3, '2024-2025'),
('Data Science', 'DS', 'Fakulteti i Teknologjisë së Informacionit', 'Master', 2, '2024-2025'),
('Cybersecurity', 'CYB', 'Fakulteti i Teknologjisë së Informacionit', 'Master', 2, '2024-2025')
ON CONFLICT (code) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('max_daily_document_generation', '10', 'Maximum documents per student per day'),
('document_validity_days', '365', 'Default document validity period in days'),
('system_name', 'UniDocs', 'System name'),
('institution_name', 'Universiteti Politeknik i Tiranës', 'Institution name'),
('faculty_name', 'Fakulteti i Teknologjisë së Informacionit', 'Faculty name')
ON CONFLICT (setting_key) DO NOTHING;
