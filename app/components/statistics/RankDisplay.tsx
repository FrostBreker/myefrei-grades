import {Trophy} from "lucide-react";

// Component to display rank with medal
export function RankDisplay({rank, total}: { rank: number | null; total: number }) {
    if (rank === null || total === 0) {
        return <span className="text-muted-foreground">-</span>;
    }

    const percentage = (rank / total) * 100;
    let color = "text-muted-foreground";
    let icon = null;

    if (rank === 1) {
        color = "text-yellow-500";
        icon = <Trophy className="h-4 w-4 inline mr-1"/>;
    } else if (rank === 2) {
        color = "text-gray-400";
        icon = <Trophy className="h-4 w-4 inline mr-1"/>;
    } else if (rank === 3) {
        color = "text-amber-600";
        icon = <Trophy className="h-4 w-4 inline mr-1"/>;
    } else if (percentage <= 10) {
        color = "text-green-500";
    } else if (percentage <= 25) {
        color = "text-blue-500";
    } else if (percentage > 75) {
        color = "text-red-500";
    }

    return (
        <span className={`font-bold ${color}`}>
            {icon}
            {rank}/{total}
        </span>
    );
}