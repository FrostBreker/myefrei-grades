"use client";

import {useEffect, useState} from "react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {ExternalLink, Loader2, Tag, History, RefreshCw} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";

interface GitHubRelease {
    id: number;
    tag_name: string;
    name: string;
    body: string;
    published_at: string;
    html_url: string;
    prerelease: boolean;
}

const GITHUB_REPO = "myefrei-grades";
const GITHUB_OWNER = "FrostBreker";

export function ChangelogsPage() {
    const [releases, setReleases] = useState<GitHubRelease[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReleases = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases`,
                {
                    headers: {
                        Accept: "application/vnd.github.v3+json",
                    },
                }
            );

            if (!response.ok) {
                if (response.status === 404) {
                    setError("Repository non trouvé");
                } else if (response.status === 403) {
                    setError("Limite d'API atteinte. Réessayez plus tard.");
                } else {
                    setError("Erreur lors de la récupération des releases");
                }
                setLoading(false);
                return;
            }

            const data: GitHubRelease[] = await response.json();
            setReleases(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Une erreur est survenue");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReleases();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    };

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3">
                    <History className="h-6 w-6 sm:h-8 sm:w-8 text-primary"/>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Changelogs</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Historique des mises à jour
                        </p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchReleases}
                    disabled={loading}
                    className="gap-2 w-full sm:w-auto cursor-pointer"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}/>
                    Actualiser
                </Button>
            </div>

            {loading && (
                <div className="flex items-center justify-center py-12 sm:py-16">
                    <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground"/>
                </div>
            )}

            {error && (
                <Card className="border-destructive">
                    <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                        <p className="text-red-500 mb-4 text-base sm:text-lg text-center">{error}</p>
                        <Button variant="outline" onClick={fetchReleases} className={"cursor-pointer"}>
                            Réessayer
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && releases.length === 0 && (
                <Card>
                    <CardContent className="flex items-center justify-center py-8 sm:py-12 px-4">
                        <p className="text-muted-foreground text-base sm:text-lg text-center">
                            Aucune release trouvée.
                        </p>
                    </CardContent>
                </Card>
            )}

            {!loading && !error && releases.length > 0 && (
                <div className="space-y-4 sm:space-y-6">
                    {releases.map((release, index) => (
                        <Card
                            key={release.id}
                            className={index === 0 ? "border-primary/50 shadow-md" : ""}
                        >
                            <CardHeader className="p-4 sm:pb-3 sm:p-6">
                                <div className="flex flex-row sm:items-start justify-between gap-3 sm:gap-4">
                                    <div className="space-y-2 flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge
                                                variant={index === 0 ? "default" : "secondary"}
                                                className="flex items-center gap-1 text-xs"
                                            >
                                                <Tag className="h-3 w-3"/>
                                                {release.tag_name}
                                            </Badge>
                                            {index === 0 && (
                                                <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                                                    Dernière version
                                                </Badge>
                                            )}
                                            {release.prerelease && (
                                                <Badge variant="outline" className="text-orange-500 border-orange-500 text-xs">
                                                    Pre-release
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg sm:text-xl break-words">
                                            {release.name || release.tag_name}
                                        </CardTitle>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            Publié le {formatDate(release.published_at)}
                                        </p>
                                    </div>
                                    <a
                                        href={release.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-md self-start shrink-0"
                                        title="Voir sur GitHub"
                                    >
                                        <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5"/>
                                    </a>
                                </div>
                            </CardHeader>
                            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground">
                                    {release.body ? (
                                        <ReactMarkdown
                                            components={{
                                                h1: ({children}) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
                                                h2: ({children}) => <h2 className="text-lg font-semibold mt-3 mb-2">{children}</h2>,
                                                h3: ({children}) => <h3 className="text-base font-medium mt-2 mb-1">{children}</h3>,
                                                p: ({children}) => <p className="text-sm my-1">{children}</p>,
                                                ul: ({children}) => <ul className="list-disc ml-4 my-2 space-y-1">{children}</ul>,
                                                ol: ({children}) => <ol className="list-decimal ml-4 my-2 space-y-1">{children}</ol>,
                                                li: ({children}) => <li className="text-sm">{children}</li>,
                                                a: ({href, children}) => (
                                                    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                                        {children}
                                                    </a>
                                                ),
                                                code: ({children}) => (
                                                    <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>
                                                ),
                                                pre: ({children}) => (
                                                    <pre className="bg-muted p-3 rounded-md overflow-x-auto text-xs my-2">{children}</pre>
                                                ),
                                                blockquote: ({children}) => (
                                                    <blockquote className="border-l-2 border-primary pl-3 italic text-muted-foreground my-2">{children}</blockquote>
                                                ),
                                                strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                                em: ({children}) => <em className="italic">{children}</em>,
                                            }}
                                        >
                                            {release.body}
                                        </ReactMarkdown>
                                    ) : (
                                        <p className="text-muted-foreground">Aucune description disponible.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

