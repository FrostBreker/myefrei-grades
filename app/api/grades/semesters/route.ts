import { NextResponse } from "next/server";
import {getUserSemesters, getSemesterById, updateSemesterGrades, updateSemesterBranch} from "@lib/grades/semesterService";
import clientPromise from "@lib/mongodb";
import { UE } from "@lib/grades/types";
import {requestAuthCheck} from "@lib/api/request_check";

export async function GET(request: Request) {
    try {
        // Check authentication
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        // Check if requesting a specific semester
        const { searchParams } = new URL(request.url);
        const semesterId = searchParams.get('id');

        // Get user ID
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // If specific semester requested
        if (semesterId) {
            const semester = await getSemesterById(semesterId);

            if (!semester) {
                return NextResponse.json(
                    { error: "Semestre non trouvé" },
                    { status: 404 }
                );
            }

            // Verify user owns this semester
            if (semester.userId !== user._id.toString()) {
                return NextResponse.json(
                    { error: "Non autorisé" },
                    { status: 403 }
                );
            }

            return NextResponse.json({
                success: true,
                semester
            });
        }

        // Get all user semesters
        const semesters = await getUserSemesters(user._id.toString());

        return NextResponse.json({
            success: true,
            semesters
        });
    } catch (error) {
        console.error("Error getting semesters:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

/**
 * PUT - Update grades for a semester
 */
export async function PUT(request: Request) {
    try {
        const session = await requestAuthCheck();
        if (!session || !session?.user) return;

        const { semesterId, ues, branch } = await request.json();

        if (!semesterId || (!ues && !branch)) {
            return NextResponse.json(
                { error: "Paramètres manquants" },
                { status: 400 }
            );
        }

        // Get user ID
        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection('users').findOne({ email: session.user.email });

        if (!user) {
            return NextResponse.json(
                { error: "Utilisateur non trouvé" },
                { status: 404 }
            );
        }

        // Verify user owns this semester
        const existingSemester = await getSemesterById(semesterId);
        if (!existingSemester) {
            return NextResponse.json(
                { error: "Semestre non trouvé" },
                { status: 404 }
            );
        }

        if (existingSemester.userId !== user._id.toString()) {
            return NextResponse.json(
                { error: "Non autorisé" },
                { status: 403 }
            );
        }

        // Check if semester is locked
        if (existingSemester.locked) {
            return NextResponse.json(
                { error: "Ce semestre est verrouillé" },
                { status: 403 }
            );
        }

        if (ues) {
            // Update grades
            const updatedSemester = await updateSemesterGrades(semesterId, ues as UE[]);

            return NextResponse.json({
                success: true,
                semester: updatedSemester
            });
        } else if (branch) {
            const updatedSemester = await updateSemesterBranch(semesterId, branch as string);

            return NextResponse.json({
                success: true,
                semester: updatedSemester
            });
        }



    } catch (error) {
        console.error("Error updating grades:", error);
        return NextResponse.json(
            { error: "Erreur serveur" },
            { status: 500 }
        );
    }
}

