import clientPromise from "../mongodb";
import { ObjectId } from "mongodb";
import {
    UserSemesterDB,
    UserSemester,
    UE,
    AcademicYearTemplateDB
} from "./types";
import { calculateSemesterAverage, calculateECTSObtained } from "./utils";

const SEMESTER_COLLECTION = "userSemesters";
const YEAR_TEMPLATE_COLLECTION = "academicYearTemplates";

/**
 * Get all semesters for a user
 */
export async function getUserSemesters(userId: string): Promise<UserSemester[]> {
    const client = await clientPromise;
    const db = client.db();

    const semesters = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .find({ userId: new ObjectId(userId) })
        .sort({ academicYear: -1, semester: 1 })
        .toArray();

    return semesters.map(semester => ({
        ...semester,
        _id: semester._id.toString(),
        userId: semester.userId.toString(),
        templateId: semester.templateId.toString()
    }));
}

/**
 * Get semester by ID
 */
export async function getSemesterById(semesterId: string): Promise<UserSemester | null> {
    const client = await clientPromise;
    const db = client.db();

    const semester = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .findOne({ _id: new ObjectId(semesterId) });

    if (!semester) return null;

    return {
        ...semester,
        _id: semester._id.toString(),
        userId: semester.userId.toString(),
        templateId: semester.templateId.toString()
    };
}

/**
 * Update grades in a semester (updates entire UE structure)
 */
export async function updateSemesterGrades(
    semesterId: string,
    ues: UE[]
): Promise<UserSemester | null> {
    const client = await clientPromise;
    const db = client.db();

    // Calculate new average and ECTS
    const { average } = calculateSemesterAverage(ues);
    const ectsObtained = calculateECTSObtained(ues);

    const result = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .findOneAndUpdate(
            { _id: new ObjectId(semesterId) },
            {
                $set: {
                    ues,
                    average,
                    ectsObtained,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    if (!result.value) return null;

    return {
        ...result.value,
        _id: result.value._id.toString(),
        userId: result.value.userId.toString(),
        templateId: result.value.templateId.toString()
    };
}

/**
 * Update the branch of a semester
 */
export async function updateSemesterBranch(
    semesterId: string,
    branch: string
): Promise<UserSemester | null> {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .findOneAndUpdate(
            { _id: new ObjectId(semesterId) },
            {
                $set: {
                    branch,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    if (!result.value) return null;

    return {
        ...result.value,
        _id: result.value._id.toString(),
        userId: result.value.userId.toString(),
        templateId: result.value.templateId.toString()
    };
}

/**
 * Lock/unlock a semester
 */
export async function toggleSemesterLock(semesterId: string): Promise<UserSemester | null> {
    const client = await clientPromise;
    const db = client.db();

    const semester = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .findOne({ _id: new ObjectId(semesterId) });

    if (!semester) return null;

    const result = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .findOneAndUpdate(
            { _id: new ObjectId(semesterId) },
            {
                $set: {
                    locked: !semester.locked,
                    updatedAt: new Date()
                }
            },
            { returnDocument: 'after' }
        );

    if (!result.value) return null;

    return {
        ...result.value,
        _id: result.value._id.toString(),
        userId: result.value.userId.toString(),
        templateId: result.value.templateId.toString()
    };
}

/**
 * Delete a semester
 */
export async function deleteSemester(semesterId: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db();

    const result = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .deleteOne({ _id: new ObjectId(semesterId) });

    return result.deletedCount > 0;
}

/**
 * Sync user semesters with an updated year template
 * This updates all user semesters that use this template
 * Preserves existing user grades while updating structure
 * Also creates new semesters if they were added to the template
 */
export async function syncUserSemestersWithYearTemplate(templateId: string): Promise<number> {
    const client = await clientPromise;
    const db = client.db();

    // Get the year template
    const template = await db.collection<AcademicYearTemplateDB>(YEAR_TEMPLATE_COLLECTION)
        .findOne({ _id: new ObjectId(templateId) });

    if (!template) return 0;

    // Find all user semesters that match this template's profile
    // (same cursus, filiere, groupe, academicYear)
    const userSemesters = await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
        .find({
            cursus: template.cursus,
            filiere: template.filiere,
            groupe: template.groupe,
            academicYear: template.academicYear
        })
        .toArray();

    let updatedCount = 0;

    // Group user semesters by userId to identify which users have which semesters
    const userSemesterMap = new Map<string, UserSemesterDB[]>();
    for (const userSemester of userSemesters) {
        const userIdStr = userSemester.userId.toString();
        if (!userSemesterMap.has(userIdStr)) {
            userSemesterMap.set(userIdStr, []);
        }
        userSemesterMap.get(userIdStr)!.push(userSemester);
    }

    // Process each user
    for (const [userIdStr, userSemesterList] of userSemesterMap) {
        const existingSemesterNumbers = new Set(userSemesterList.map(s => s.semester));
        const firstUserSemester = userSemesterList[0]; // Used to get user info

        // Check for missing semesters and create them
        for (const templateSemester of template.semesters) {
            if (!existingSemesterNumbers.has(templateSemester.semester)) {
                // This semester doesn't exist for the user, create it
                const newUEs: UE[] = templateSemester.ues.map(templateUE => ({
                    ...templateUE,
                    modules: templateUE.modules.map(templateModule => ({
                        ...templateModule,
                        grades: templateModule.grades.map(templateGrade => ({
                            ...templateGrade,
                            grade: null
                        })),
                        average: null
                    })),
                    average: null
                }));

                const newSemester: Omit<UserSemesterDB, '_id'> = {
                    userId: new ObjectId(userIdStr),
                    userEmail: firstUserSemester.userEmail,
                    templateId: template._id,
                    templateVersion: template.version,
                    name: templateSemester.name,
                    code: template.code,
                    cursus: template.cursus,
                    filiere: template.filiere,
                    groupe: template.groupe,
                    branch: "",
                    semester: templateSemester.semester,
                    academicYear: template.academicYear,
                    ues: newUEs,
                    totalECTS: templateSemester.totalECTS,
                    average: null,
                    ectsObtained: null,
                    locked: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };

                await db.collection<UserSemesterDB>(SEMESTER_COLLECTION).insertOne(newSemester as UserSemesterDB);
                updatedCount++;
            }
        }

        // Update existing semesters
        for (const userSemester of userSemesterList) {
            // Find the matching semester data in the template
            const templateSemester = template.semesters.find(s => s.semester === userSemester.semester);

            if (!templateSemester) {
                // Semester no longer exists in template, skip it
                continue;
            }

            // Merge new template structure with existing user grades
            const updatedUEs: UE[] = templateSemester.ues.map(templateUE => {
                // Find existing UE data from user
                const existingUE = userSemester.ues.find(ue => ue.id === templateUE.id || ue.code === templateUE.code);

                return {
                    ...templateUE,
                    modules: templateUE.modules.map(templateModule => {
                        // Find existing module data
                        const existingModule = existingUE?.modules.find(
                            m => m.id === templateModule.id || m.code === templateModule.code
                        );

                        return {
                            ...templateModule,
                            grades: templateModule.grades.map(templateGrade => {
                                // Find existing grade
                                const existingGrade = existingModule?.grades.find(
                                    g => g.id === templateGrade.id || (g.type === templateGrade.type && g.name === templateGrade.name)
                                );

                                if (existingGrade) {
                                    // Keep user's grade but update other fields from template
                                    return {
                                        ...templateGrade,
                                        grade: existingGrade.grade // Preserve user's grade!
                                    };
                                } else {
                                    // New grade added to template
                                    return {
                                        ...templateGrade,
                                        grade: null
                                    };
                                }
                            }),
                            average: existingModule?.average || null
                        };
                    }),
                    average: existingUE?.average || null
                };
            });

            // Recalculate averages
            const { average } = calculateSemesterAverage(updatedUEs);
            const ectsObtained = calculateECTSObtained(updatedUEs);

            // Update user semester
            await db.collection<UserSemesterDB>(SEMESTER_COLLECTION)
                .updateOne(
                    { _id: userSemester._id },
                    {
                        $set: {
                            ues: updatedUEs,
                            average,
                            ectsObtained,
                            totalECTS: templateSemester.totalECTS,
                            templateVersion: template.version,
                            name: templateSemester.name,
                            updatedAt: new Date()
                        }
                    }
                );

            updatedCount++;
        }
    }

    return updatedCount;
}

