import {NextResponse} from "next/server";
import {requestAuthCheck} from "@lib/api/request_check";
import {instrumentApiRoute, noticeError} from "@lib/newrelic";
import {UserSemesterDB} from "@lib/grades/types";
import {GetUserSemesterBySemesterId} from "@lib/userSemesters/users";
import {GetGlobalStatistics} from "@lib/stats/global_statistics";
import {UserStats} from "@lib/stats/types";

export async function GET(request: Request) {
    return instrumentApiRoute('grades/stats/GET', async () => {
        try {
            const session = await requestAuthCheck();
            if (!session || !session?.user) {
                return NextResponse.json(
                    {error: "Non autorisé"},
                    {status: 401}
                );
            }
            console.log(request.url);
            const {searchParams} = new URL(request.url);
            const semesterId = searchParams.get('semesterId');

            if (!semesterId) {
                return NextResponse.json(
                    {error: "semesterId requis"},
                    {status: 400}
                );
            }

            const semester: UserSemesterDB | null = await GetUserSemesterBySemesterId(semesterId);
            if (!semester) {
                return NextResponse.json(
                    {error: "Semestre non trouvé"},
                    {status: 404}
                );
            }

            const stats: UserStats | null = await GetGlobalStatistics({
                userId: semester.userId,
                semester: semester.semester,
                academicYear: semester.academicYear,
            });
            if (!stats) {
                return NextResponse.json(
                    {error: "Statistiques non trouvées"},
                    {status: 404}
                );
            }

            return NextResponse.json({
                success: true,
                stats,
                userAverage: stats.overall?.userAverage?.current,
            });

        } catch (error) {
            console.error("Error getting stats:", error);
            if (error instanceof Error) noticeError(error, {route: 'grades/stats/GET'});
            return NextResponse.json(
                {error: "Erreur serveur"},
                {status: 500}
            );
        }
    }, {email: undefined});
}