import { ObjectId } from "mongodb";

// Available cursus types
export type Cursus = "PGE" | "PEX";

// Filieres - accepts any string to support hundreds of different filieres
export type Filiere = string;

// Group types - accepts any string to support custom groups
export type Groupe = string;

// Grade types for different evaluations
export type GradeType = "TP" | "TD" | "PRJ" | "DE" | "CC" | "CO" | "CE" | "TOEIC" | "AUTRE";

// Individual grade entry (e.g., TP1, CC1, etc.)
export interface GradeEntry {
    id: string;
    type: GradeType;
    name: string;
    coefficient: number;
    grade: number | null;
    maxGrade: number;
    date?: Date;
}

// Module within a UE (contains multiple grades)
export interface Module {
    id: string;
    name: string;
    code: string;
    coefficient: number;
    description?: string;
    grades: GradeEntry[];
    average?: number | null;
}

// UE (Unité d'Enseignement) - Teaching Unit
export interface UE {
    id: string;
    name: string;
    code: string;
    ects: number;
    coefficient: number;
    modules: Module[];
    average?: number | null;
}

// Semester data within an academic year template
export interface SemesterData {
    semester: number; // 1 or 2
    name: string;
    ues: UE[];
    totalECTS: number;
}

// Academic Year Template - Main template type
export interface AcademicYearTemplateDB {
    _id: ObjectId;
    name: string;
    code: string;
    cursus: Cursus;
    filiere: Filiere;
    groupe: Groupe;
    academicYear: string;
    semesters: SemesterData[];
    version: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AcademicYearTemplate extends Omit<AcademicYearTemplateDB, '_id'> {
    _id: string;
}

// User semester (instance based on year template)
export interface UserSemesterDB {
    _id: ObjectId;
    userId: ObjectId;
    userEmail: string;
    templateId: ObjectId;
    templateVersion: number;
    name: string;
    code: string;
    cursus: Cursus;
    filiere: Filiere;
    groupe: Groupe;
    semester: number;
    academicYear: string;
    ues: UE[];
    totalECTS: number;
    average: number | null;
    ectsObtained: number | null;
    locked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserSemester extends Omit<UserSemesterDB, '_id' | 'userId' | 'templateId'> {
    _id: string;
    userId: string;
    templateId: string;
}

// Academic path - represents one year/filiere/groupe combination
export interface AcademicPath {
    id: string;
    cursus: Cursus;
    filiere: Filiere;
    groupe: Groupe;
    academicYear: string;
    isActive: boolean;
    createdAt: Date;
}

// User profile with multiple academic paths
export interface AcademicProfileDB {
    _id: ObjectId;
    userId: ObjectId;
    userEmail: string;
    paths: AcademicPath[];
    entryYear: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface AcademicProfile extends Omit<AcademicProfileDB, '_id' | 'userId'> {
    _id: string;
    userId: string;
}

// Helper for average calculation
export interface CalculMoyenne {
    average: number | null;
    totalCoefficients: number;
    totalECTS: number;
    missingGrades: number;
}
