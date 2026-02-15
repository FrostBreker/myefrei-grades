import {ChangelogsPage} from "@/app/components/pages/ChangelogsPage";
import {Metadata} from "next";

export const metadata: Metadata = {
    title: "Changelogs | MyEfrei Grades",
    description: "Historique des mises à jour et nouveautés de MyEfrei Grades",
};

export default function Changelogs() {
    return <ChangelogsPage />;
}


