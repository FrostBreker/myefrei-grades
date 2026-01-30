import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@lib/mongodb";
import { ObjectId } from "mongodb";
import {requestAdminCheck} from "@lib/api/request_check";

export async function GET(request: NextRequest) {
    try {
        const isAuthorized = await requestAdminCheck();
        if (!isAuthorized) return;

        const { searchParams } = new URL(request.url);
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const client = await clientPromise;
        const db = client.db();

        // Construire la requête de recherche
        let query = {};
        if (search) {
            const searchRegex = { $regex: search, $options: "i" };
            query = {
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex },
                    { studentNumber: searchRegex },
                ]
            };
        }

        // Récupérer les utilisateurs
        const users = await db.collection('users')
            .find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        // Compter le total pour la pagination
        const total = await db.collection('users').countDocuments(query);

        // Récupérer les profils académiques pour chaque utilisateur (userId est un ObjectId)
        const userObjectIds = users.map(u => new ObjectId(u._id));
        const academicProfiles = await db.collection('academicProfiles')
            .find({ userId: { $in: userObjectIds } })
            .toArray();

        // Mapper les profils par userId (converti en string pour la comparaison)
        const profilesMap = new Map();
        academicProfiles.forEach(profile => {
            profilesMap.set(profile.userId.toString(), profile);
        });

        // Formater les données des utilisateurs
        const formattedUsers = users.map(user => {
            const academicProfile = profilesMap.get(user._id.toString());

            // Récupérer le parcours le plus récent
            let currentPath = null;
            if (academicProfile && academicProfile.paths && academicProfile.paths.length > 0) {
                const sortedPaths = [...academicProfile.paths].sort((a: { academicYear: string }, b: { academicYear: string }) =>
                    b.academicYear.localeCompare(a.academicYear)
                );
                currentPath = sortedPaths[0];
            }

            return {
                _id: user._id.toString(),
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email,
                studentNumber: user.studentNumber || "",
                image: user.image || "",
                createdAt: user.createdAt?.toISOString() || null,
                lastLogin: user.lastLogin?.toISOString() || null,
                cursus: currentPath?.cursus || "",
                filiere: currentPath?.filiere || "",
                groupe: currentPath?.groupe || "",
                academicYear: currentPath?.academicYear || "",
            };
        });

        return NextResponse.json({
            success: true,
            users: formattedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            }
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
