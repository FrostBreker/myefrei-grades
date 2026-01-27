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
    Users,
    Search,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Mail,
    GraduationCap,
    Hash,
    Calendar
} from "lucide-react";

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
            </div>
        </div>
    );
}
