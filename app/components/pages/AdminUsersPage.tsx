"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Users,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Mail,
    GraduationCap,
    Hash,
    Calendar,
    Settings,
    BookOpen
} from "lucide-react";

interface TemplateOption {
    cursus: string;
    filiere: string;
    groupe: string;
    academicYear: string;
    hasS1: boolean;
    hasS2: boolean;
}

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentNumber: string;
    image: string;
    createdAt: string | null;
    lastLogin: string | null;
    cursus: string;
    filiere: string;
    groupe: string;
    academicYear: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });

    // Change path dialog states
    const [changePathDialogOpen, setChangePathDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
    const [changingPath, setChangingPath] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (search) {
                params.append("search", search);
            }

            const response = await fetch(`/api/admin/users?${params}`);
            const data = await response.json();

            if (data.success) {
                setUsers(data.users);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit, search]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearch(searchInput);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const loadTemplates = async () => {
        setLoadingTemplates(true);
        try {
            const response = await fetch("/api/admin/year-templates");
            const data = await response.json();

            if (data.success) {
                interface TemplateResponse {
                    cursus: string;
                    filiere: string;
                    groupe: string;
                    academicYear: string;
                    semesters: { semester: number }[];
                }
                const options: TemplateOption[] = data.templates.map((template: TemplateResponse) => ({
                    cursus: template.cursus,
                    filiere: template.filiere,
                    groupe: template.groupe,
                    academicYear: template.academicYear,
                    hasS1: template.semesters.some((s: { semester: number }) => s.semester === 1),
                    hasS2: template.semesters.some((s: { semester: number }) => s.semester === 2)
                }));
                setTemplateOptions(options);
            }
        } catch (error) {
            console.error("Error loading templates:", error);
        } finally {
            setLoadingTemplates(false);
        }
    };

    const openChangePathDialog = (user: User) => {
        setSelectedUser(user);
        setSelectedTemplate(null);
        setChangePathDialogOpen(true);
        loadTemplates();
    };

    const handleChangePath = async () => {
        if (!selectedUser || !selectedTemplate) return;

        setChangingPath(true);
        try {
            const response = await fetch(`/api/admin/users/${selectedUser._id}/path`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cursus: selectedTemplate.cursus,
                    filiere: selectedTemplate.filiere,
                    groupe: selectedTemplate.groupe,
                    academicYear: selectedTemplate.academicYear
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Parcours mis à jour avec succès !");
                setChangePathDialogOpen(false);
                setSelectedUser(null);
                setSelectedTemplate(null);
                fetchUsers(); // Refresh users list
            } else {
                alert(`❌ Erreur : ${data.error}`);
            }
        } catch (error) {
            console.error("Error changing path:", error);
            alert("❌ Erreur lors du changement de parcours");
        } finally {
            setChangingPath(false);
        }
    };

    const getUserInitials = (user: User) => {
        if (user.firstName && user.lastName) {
            return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
        }
        return user.email.charAt(0).toUpperCase();
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "—";
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-background to-muted py-8 md:py-12">
            <div className="px-4 sm:px-6 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Users className="h-8 w-8 text-primary" />
                            Gestion des Utilisateurs
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {pagination.total} utilisateur{pagination.total > 1 ? "s" : ""} enregistré{pagination.total > 1 ? "s" : ""}
                        </p>
                    </div>
                </div>

                {/* Search */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5" />
                            Rechercher
                        </CardTitle>
                        <CardDescription>
                            Recherche par nom, prénom, email ou numéro étudiant
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-3">
                            <Input
                                placeholder="Rechercher un utilisateur..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">Rechercher</span>
                            </Button>
                            {search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch("");
                                        setSearchInput("");
                                    }}
                                >
                                    Effacer
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <p className="font-medium">Aucun utilisateur trouvé</p>
                                <p className="text-sm text-muted-foreground">
                                    {search ? "Essayez une autre recherche" : "Aucun utilisateur enregistré"}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table */}
                                <div className="hidden md:block overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Utilisateur</TableHead>
                                                <TableHead>N° Étudiant</TableHead>
                                                <TableHead>Parcours</TableHead>
                                                <TableHead>Inscrit le</TableHead>
                                                <TableHead>Dernière connexion</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {users.map((user) => (
                                                <TableRow key={user._id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-10 w-10">
                                                                <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
                                                                <AvatarFallback className="bg-primary text-primary-foreground">
                                                                    {getUserInitials(user)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {user.firstName && user.lastName
                                                                        ? `${user.firstName} ${user.lastName}`
                                                                        : <span className="text-muted-foreground italic">Non renseigné</span>
                                                                    }
                                                                </p>
                                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.studentNumber ? (
                                                            <code className="bg-muted px-2 py-1 rounded text-sm">
                                                                {user.studentNumber}
                                                            </code>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">—</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {user.cursus ? (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="default" className="text-xs">Actif</Badge>
                                                                    <Badge variant="secondary" className="text-xs">{user.academicYear}</Badge>
                                                                </div>
                                                                <p className="text-sm">
                                                                    {user.cursus} • {user.filiere} • {user.groupe}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">Non configuré</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(user.createdAt)}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(user.lastLogin)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openChangePathDialog(user)}
                                                            className="cursor-pointer"
                                                        >
                                                            <Settings className="h-4 w-4 mr-1" />
                                                            Parcours
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Mobile Cards */}
                                <div className="md:hidden divide-y">
                                    {users.map((user) => (
                                        <div key={user._id} className="p-4 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarImage src={user.image} alt={`${user.firstName} ${user.lastName}`} />
                                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                                        {getUserInitials(user)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">
                                                        {user.firstName && user.lastName
                                                            ? `${user.firstName} ${user.lastName}`
                                                            : <span className="text-muted-foreground italic">Non renseigné</span>
                                                        }
                                                    </p>
                                                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-4 w-4 text-muted-foreground" />
                                                    {user.studentNumber || <span className="text-muted-foreground italic">—</span>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(user.createdAt)}
                                                </div>
                                            </div>
                                            {user.cursus && (
                                                <div className="p-2 rounded-lg bg-primary/5 border border-primary/20">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="default" className="text-xs">Actif</Badge>
                                                        <Badge variant="secondary" className="text-xs">{user.academicYear}</Badge>
                                                    </div>
                                                    <p className="text-sm flex items-center gap-1">
                                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                        {user.cursus} • {user.filiere} • {user.groupe}
                                                    </p>
                                                </div>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openChangePathDialog(user)}
                                                className="w-full cursor-pointer"
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                Modifier le parcours
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {pagination.page} sur {pagination.totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page <= 1 || loading}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Précédent
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={pagination.page >= pagination.totalPages || loading}
                            >
                                Suivant
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {/* Change Path Dialog */}
                <Dialog open={changePathDialogOpen} onOpenChange={setChangePathDialogOpen}>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <GraduationCap className="h-5 w-5" />
                                Modifier le parcours
                            </DialogTitle>
                            <DialogDescription>
                                {selectedUser && (
                                    <span>
                                        Modifier le parcours de <strong>{selectedUser.firstName} {selectedUser.lastName}</strong>
                                        {selectedUser.email && <span className="text-muted-foreground"> ({selectedUser.email})</span>}
                                    </span>
                                )}
                            </DialogDescription>
                        </DialogHeader>

                        {selectedUser && selectedUser.cursus && (
                            <div className="my-4 p-4 bg-muted/50 rounded-lg border">
                                <p className="text-sm text-muted-foreground mb-2">Parcours actuel :</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary">{selectedUser.cursus}</Badge>
                                    <Badge variant="secondary">{selectedUser.filiere}</Badge>
                                    <Badge variant="outline">{selectedUser.groupe}</Badge>
                                    <span className="text-sm text-muted-foreground">({selectedUser.academicYear})</span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 py-4">
                            <p className="text-sm font-medium">Sélectionnez le nouveau parcours :</p>
                            {loadingTemplates ? (
                                <div className="text-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                                    <p className="text-muted-foreground">Chargement des parcours disponibles...</p>
                                </div>
                            ) : templateOptions.length === 0 ? (
                                <div className="text-center py-8">
                                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                    <p className="text-muted-foreground">
                                        Aucun parcours disponible. Créez d&apos;abord des modèles d&apos;année.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                        {templateOptions.map((option, index) => (
                                            <Card
                                                key={index}
                                                className={`cursor-pointer transition-all hover:shadow-md ${
                                                    selectedTemplate === option
                                                        ? "border-2 border-primary bg-primary/5"
                                                        : "border-2 border-transparent"
                                                }`}
                                                onClick={() => setSelectedTemplate(option)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                    <Badge variant="secondary">{option.cursus}</Badge>
                                                                    <Badge variant="secondary">{option.filiere}</Badge>
                                                                    <Badge variant="outline">{option.groupe}</Badge>
                                                                </div>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Année : {option.academicYear}
                                                                </p>
                                                                <div className="flex gap-2 mt-2">
                                                                    {option.hasS1 ? (
                                                                        <Badge className="bg-green-500 text-xs">S1 ✓</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs text-muted-foreground">S1 ✕</Badge>
                                                                    )}
                                                                    {option.hasS2 ? (
                                                                        <Badge className="bg-blue-500 text-xs">S2 ✓</Badge>
                                                                    ) : (
                                                                        <Badge variant="outline" className="text-xs text-muted-foreground">S2 ✕</Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {selectedTemplate === option && (
                                                            <Badge className="ml-4">Sélectionné</Badge>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    <div className="flex gap-3 pt-4 border-t">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                setChangePathDialogOpen(false);
                                                setSelectedUser(null);
                                                setSelectedTemplate(null);
                                            }}
                                            className="flex-1 cursor-pointer"
                                        >
                                            Annuler
                                        </Button>
                                        <Button
                                            onClick={handleChangePath}
                                            disabled={!selectedTemplate || changingPath}
                                            className="flex-1 cursor-pointer"
                                        >
                                            {changingPath ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Mise à jour...
                                                </>
                                            ) : (
                                                <>
                                                    <GraduationCap className="h-4 w-4 mr-2" />
                                                    Appliquer le parcours
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
