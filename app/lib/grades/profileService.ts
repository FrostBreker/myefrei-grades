import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";
import {
    AcademicProfileDB,
    AcademicProfile,
    AcademicPath,
    Cursus,
    Filiere,
    Groupe,
    AcademicYearTemplateDB,
    UserSemesterDB
} from "./types";
import { getCurrentAcademicYear } from "./utils";

const PROFILE_COLLECTION = "academicProfiles";
const YEAR_TEMPLATE_COLLECTION = "academicYearTemplates";
const SEMESTER_COLLECTION = "userSemesters";

/**
 * Create user semesters from a year template for a specific path
 */
async function createUserSemestersFromTemplate(
    userId: string,
    userEmail: string,
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe,
    academicYear: string
): Promise<void> {
    const client = await clientPromise;
    const db = client.db();

    // Find matching year template
    const template = await db.collection<AcademicYearTemplateDB>(YEAR_TEMPLATE_COLLECTION)
        .findOne({
            cursus,
            filiere,
            groupe,
            academicYear
        });

    if (!template || template.semesters.length === 0) {
        // No template found or no semesters defined - user will add semesters manually later
        return;
    }

    // Check if user already has semesters for this combination
    const existingSemesters = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .find({
            userId: new ObjectId(userId),
            cursus,
            filiere,
            groupe,
            academicYear
        })
        .toArray();

    const existingSemesterNumbers = existingSemesters.map(s => s.semester);

    // Create user semesters for each semester in the template that doesn't exist yet
    const semestersToCreate: Omit<UserSemesterDB, '_id'>[] = [];

    for (const semesterData of template.semesters) {
        // Skip if user already has this semester
        if (existingSemesterNumbers.includes(semesterData.semester)) {
            continue;
        }

        semestersToCreate.push({
            userId: new ObjectId(userId),
            userEmail,
            templateId: template._id,
            templateVersion: template.version,
            name: semesterData.name,
            code: `${template.code}_S${semesterData.semester}`,
            cursus,
            filiere,
            groupe,
            semester: semesterData.semester,
            academicYear,
            ues: semesterData.ues.map(ue => ({
                ...ue,
                modules: ue.modules.map(module => ({
                    ...module,
                    grades: module.grades.map(grade => ({
                        ...grade,
                        grade: null // Initialize with no grade
                    })),
                    average: null
                })),
                average: null
            })),
            totalECTS: semesterData.totalECTS,
            average: null,
            ectsObtained: null,
            locked: false,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    if (semestersToCreate.length > 0) {
        await db.collection<Omit<UserSemesterDB, '_id'>>(SEMESTER_COLLECTION)
            .insertMany(semestersToCreate);
    }
}

/**
 * Get user's academic profile
 */
export async function getAcademicProfile(userId: string): Promise<AcademicProfile | null> {
    const client = await clientPromise;
    const db = client.db();

    const profile = await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
        .findOne({ userId: new ObjectId(userId) });

    if (!profile) return null;

    return {
        ...profile,
        _id: profile._id.toString(),
        userId: profile.userId.toString()
    };
}

/**
 * Create academic profile with first path
 */
export async function createAcademicProfile(
    userId: string,
    userEmail: string,
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe
): Promise<AcademicProfile> {
    const client = await clientPromise;
    const db = client.db();

    const currentYear = new Date().getFullYear();
    const academicYear = getCurrentAcademicYear();

    // Create first academic path
    const firstPath: AcademicPath = {
        id: `PATH_${Date.now()}`,
        cursus,
        filiere,
        groupe,
        academicYear,
        isActive: true,
        createdAt: new Date()
    };

    const newProfile: Omit<AcademicProfileDB, '_id'> = {
        userId: new ObjectId(userId),
        userEmail,
        paths: [firstPath],
        entryYear: currentYear.toString(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    const result = await db.collection<Omit<AcademicProfileDB, '_id'>>(PROFILE_COLLECTION)
        .insertOne(newProfile);

    // Create user semesters from matching year template
    await createUserSemestersFromTemplate(userId, userEmail, cursus, filiere, groupe, academicYear);

    return {
        ...newProfile,
        _id: result.insertedId.toString(),
        userId: userId
    };
}

/**
 * Add a new academic path to user's profile
 */
export async function addAcademicPath(
    userId: string,
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe,
    academicYear?: string,
    setAsActive?: boolean,
    userEmail?: string
): Promise<AcademicProfile | null> {
    const client = await clientPromise;
    const db = client.db();

    const pathAcademicYear = academicYear || getCurrentAcademicYear();

    const newPath: AcademicPath = {
        id: `PATH_${Date.now()}`,
        cursus,
        filiere,
        groupe,
        academicYear: pathAcademicYear,
        isActive: setAsActive || false,
        createdAt: new Date()
    };

    // If setting as active, first deactivate all other paths
    if (setAsActive) {
        // Step 1: Deactivate all existing paths
        await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
            .updateOne(
                { userId: new ObjectId(userId) },
                { $set: { "paths.$[].isActive": false } }
            );

        // Step 2: Add the new path with isActive = true
        newPath.isActive = true;
    }

    // Add the new path
    const result = await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
        .findOneAndUpdate(
            { userId: new ObjectId(userId) },
            {
                $push: { paths: newPath },
                $set: { updatedAt: new Date() }
            },
            { returnDocument: 'after' }
        );

    if (!result.value) return null;


    // Create user semesters from matching year template
    const email = userEmail || result.value.userEmail;
    await createUserSemestersFromTemplate(userId, email, cursus, filiere, groupe, pathAcademicYear);

    return {
        ...result.value,
        _id: result.value._id.toString(),
        userId: result.value.userId.toString()
    };
}

/**
 * Set a path as active
 */
export async function setActivePath(
    userId: string,
    pathId: string
): Promise<AcademicProfile | null> {
    const client = await clientPromise;
    const db = client.db();

    const profile = await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
        .findOne({ userId: new ObjectId(userId) });

    if (!profile) return null;

    // Update paths: set all to inactive, then set the selected one to active
    const updatedPaths = profile.paths.map(p => ({
        ...p,
        isActive: p.id === pathId
    }));

    const result = await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
        .findOneAndUpdate(
            { userId: new ObjectId(userId) },
            {
                $set: {
                    paths: updatedPaths,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    if (!result.value) return null;

    return {
        ...result.value,
        _id: result.value._id.toString(),
        userId: result.value.userId.toString()
    };
}

/**
 * Remove an academic path
 */
export async function removeAcademicPath(
    userId: string,
    pathId: string
): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<AcademicProfileDB>(PROFILE_COLLECTION)
        .updateOne(
            { userId: new ObjectId(userId) },
            {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                $pull: { paths: { id: pathId } as any },
                $set: { updatedAt: new Date() }
            }
        );

    return result.modifiedCount > 0;
}

