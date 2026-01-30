import {NextRequest, NextResponse} from "next/server";
import clientPromise from "@lib/mongodb";
import {Db, ObjectId} from "mongodb";
import {AcademicPath, Cursus, Filiere, Groupe, AcademicYearTemplateDB, UserSemesterDB, UE, Module, GradeEntry} from "@lib/grades/types";
import {getCurrentAcademicYear} from "@lib/grades/utils";
import {requestAdminCheck} from "@lib/api/request_check";

const PROFILE_COLLECTION = "academicProfiles";
const YEAR_TEMPLATE_COLLECTION = "academicYearTemplates";
const SEMESTER_COLLECTION = "userSemesters";

/**
 * PUT - Admin: Change user's active academic path
 */
export async function PUT(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        const {id: userId} = await params;
        const {cursus, filiere, groupe, academicYear} = await request.json();

        if (!cursus || !filiere || !groupe) {
            return NextResponse.json(
                {error: "Cursus, filière et groupe requis"},
                {status: 400}
            );
        }

        const client = await clientPromise;
        const db = client.db();

        // Check if user exists
        const user = await db.collection('users').findOne({_id: new ObjectId(userId)});
        if (!user) {
            return NextResponse.json({error: "Utilisateur non trouvé"}, {status: 404});
        }

        const pathAcademicYear = academicYear || getCurrentAcademicYear();

        // Check if user has an academic profile
        const existingProfile = await db.collection(PROFILE_COLLECTION).findOne({
            userId: new ObjectId(userId)
        });

        const newPath: AcademicPath = {
            id: `PATH_${Date.now()}`,
            cursus: cursus as Cursus,
            filiere: filiere as Filiere,
            groupe: groupe as Groupe,
            academicYear: pathAcademicYear,
            isActive: true,
            createdAt: new Date()
        };

        if (existingProfile) {
            // Deactivate all existing paths and add new one
            const updatedPaths = existingProfile.paths.map((p: AcademicPath) => ({
                ...p,
                isActive: false
            }));
            updatedPaths.push(newPath);

            await db.collection(PROFILE_COLLECTION).updateOne(
                {userId: new ObjectId(userId)},
                {
                    $set: {
                        paths: updatedPaths,
                        updatedAt: new Date()
                    }
                }
            );
        } else {
            // Create new profile
            await db.collection(PROFILE_COLLECTION).insertOne({
                userId: new ObjectId(userId),
                userEmail: user.email,
                paths: [newPath],
                entryYear: new Date().getFullYear().toString(),
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        // Create user semesters from matching year template
        await createUserSemestersFromTemplate(
            db,
            userId,
            user.email,
            cursus as Cursus,
            filiere as Filiere,
            groupe as Groupe,
            pathAcademicYear
        );

        return NextResponse.json({
            success: true,
            message: "Parcours mis à jour avec succès"
        });
    } catch (error) {
        console.error("Error updating user path:", error);
        return NextResponse.json({error: "Erreur serveur"}, {status: 500});
    }
}

/**
 * GET - Admin: Get user's academic profile
 */
export async function GET(request: NextRequest, {params}: { params: Promise<{ id: string }> }) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        const {id: userId} = await params;

        const client = await clientPromise;
        const db = client.db();

        const profile = await db.collection(PROFILE_COLLECTION).findOne({
            userId: new ObjectId(userId)
        });

        if (!profile) {
            return NextResponse.json({
                success: true,
                profile: null
            });
        }

        return NextResponse.json({
            success: true,
            profile: {
                ...profile,
                _id: profile._id.toString(),
                userId: profile.userId.toString()
            }
        });
    } catch (error) {
        console.error("Error getting user profile:", error);
        return NextResponse.json({error: "Erreur serveur"}, {status: 500});
    }
}

/**
 * Helper function to create user semesters from template
 */
async function createUserSemestersFromTemplate(
    db: Db,
    userId: string,
    userEmail: string,
    cursus: Cursus,
    filiere: Filiere,
    groupe: Groupe,
    academicYear: string
): Promise<void> {
    // Find matching year template
    const template = await db.collection(YEAR_TEMPLATE_COLLECTION)
        .findOne({
            cursus,
            filiere,
            groupe,
            academicYear
        }) as AcademicYearTemplateDB | null;

    if (!template || template.semesters.length === 0) {
        return;
    }

    // Check if user already has semesters for this combination
    const existingSemesters = await db.collection(SEMESTER_COLLECTION)
        .find({
            userId: new ObjectId(userId),
            cursus,
            filiere,
            groupe,
            academicYear
        })
        .toArray() as UserSemesterDB[];

    const existingSemesterNumbers = existingSemesters.map((s: UserSemesterDB) => s.semester);

    // Create user semesters for each semester in the template that doesn't exist yet
    const semestersToCreate: Omit<UserSemesterDB, '_id'>[] = [];

    for (const semesterData of template.semesters) {
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
            ues: semesterData.ues.map((ue: UE) => ({
                ...ue,
                modules: ue.modules.map((module: Module) => ({
                    ...module,
                    grades: module.grades.map((grade: GradeEntry) => ({
                        ...grade,
                        grade: null
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
        await db.collection(SEMESTER_COLLECTION)
            .insertMany(semestersToCreate);
    }
}
