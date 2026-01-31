import clientPromise from "../mongodb";
import {ObjectId} from "mongodb";
import {
    AcademicYearTemplateDB,
    AcademicYearTemplate,
    SemesterData,
    Cursus,
    Filiere,
    Groupe, Branch
} from "./types";

const COLLECTION_NAME = "academicYearTemplates";

/**
 * Generate unique code for year template
 */
function generateYearCode(cursus: Cursus, filiere: Filiere, groupe: Groupe, academicYear: string): string {
    return `${cursus}_${filiere}_${groupe}_${academicYear}`.toUpperCase();
}

/**
 * Get all year templates
 */
export async function getAllYearTemplates(): Promise<AcademicYearTemplate[]> {
    const client = await clientPromise;
    const db = client.db();

    const templates = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .find({})
        .sort({academicYear: -1, cursus: 1, filiere: 1})
        .toArray();

    return templates.map(t => ({
        ...t,
        _id: t._id.toString()
    }));
}

/**
 * Get year template by ID
 */
export async function getYearTemplateById(templateId: string): Promise<AcademicYearTemplate | null> {
    const client = await clientPromise;
    const db = client.db();

    const template = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .findOne({_id: new ObjectId(templateId)});

    if (!template) return null;

    return {
        ...template,
        _id: template._id.toString()
    };
}

/**
 * Get year template by code
 */
export async function getYearTemplateByCode(code: string): Promise<AcademicYearTemplate | null> {
    const client = await clientPromise;
    const db = client.db();

    const template = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .findOne({code});

    if (!template) return null;

    return {
        ...template,
        _id: template._id.toString()
    };
}

/**
 * Get year templates by profile
 */
export async function getYearTemplatesByProfile(
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe
): Promise<AcademicYearTemplate[]> {
    const client = await clientPromise;
    const db = client.db();

    const templates = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .find({cursus, filiere, groupe})
        .sort({academicYear: -1})
        .toArray();

    return templates.map(t => ({
        ...t,
        _id: t._id.toString()
    }));
}

/**
 * Create a new year template
 */
export async function createYearTemplate(
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe,
    branches: Branch[],
    academicYear: string,
    semesters: SemesterData[]
): Promise<AcademicYearTemplate> {
    const client = await clientPromise;
    const db = client.db();

    const code = generateYearCode(cursus, filiere, groupe, academicYear);
    const name = `${filiere} ${groupe} - ${academicYear}`;

    // Check if already exists
    const existing = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .findOne({code});

    if (existing) {
        throw new Error("Template already exists for this year/filiere/groupe");
    }

    const newTemplate: Omit<AcademicYearTemplateDB, '_id'> = {
        name,
        code,
        cursus,
        filiere,
        groupe,
        branches,
        academicYear,
        semesters,
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await db.collection<Omit<AcademicYearTemplateDB, '_id'>>(COLLECTION_NAME)
        .insertOne(newTemplate);

    return {
        ...newTemplate,
        _id: result.insertedId.toString()
    };
}

/**
 * Update year template (increments version)
 */
export async function updateYearTemplate(
    templateId: string,
    templateData: AcademicYearTemplateDB
): Promise<AcademicYearTemplate | null> {
    const client = await clientPromise;
    const db = client.db();

    // Remove _id from templateData before replacing
    const {_id, cursus, filiere, groupe, academicYear, ...dataWithoutId} = templateData;
    if (!_id) {
        throw new Error("Template data must include _id");
    }
    // Recompute code and name
    const code = generateYearCode(cursus, filiere, groupe, academicYear);
    const name = `${filiere} ${groupe} - ${academicYear}`;
    const result = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .findOneAndReplace(
            {_id: new ObjectId(templateId)},
            {
                ...dataWithoutId,
                cursus,
                filiere,
                groupe,
                academicYear,
                code,
                name,
                version: templateData.version + 1,
                createdAt: new Date(templateData.createdAt),
                updatedAt: new Date()
            },
            {returnDocument: 'after'}
        );

    if (!result.value) return null;

    return {
        ...result.value,
        _id: result.value._id.toString()
    }
}

/**
 * Delete year template
 */
export async function deleteYearTemplate(templateId: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<AcademicYearTemplateDB>(COLLECTION_NAME)
        .deleteOne({_id: new ObjectId(templateId)});

    return result.deletedCount > 0;
}