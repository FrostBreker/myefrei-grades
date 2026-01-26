"use client";

import Link from "next/link";
import {useSession, signIn, signOut} from "next-auth/react";
import {Fragment, useState, useEffect} from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { GraduationCap, Home, FileText, BarChart3, Menu, Shield } from "lucide-react";
import { useIsAdmin } from "@lib/hooks/useIsAdmin";

interface UserProfile {
    firstName?: string;
    lastName?: string;
}

function Navbar() {
    const { data: session, status } = useSession();
    const { isAdmin } = useIsAdmin();
    const user = session?.user;
    const [isOpen, setIsOpen] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    // Fetch user profile to get firstName and lastName
    useEffect(() => {
        if (user?.email) {
            fetch("/api/user/profile")
                .then(res => res.json())
                .then(data => {
                    if (data.firstName && data.lastName) {
                        setUserProfile({ firstName: data.firstName, lastName: data.lastName });
                    }
                })
                .catch(err => console.error("Error fetching profile:", err));
        }
    }, [user?.email]);

    // Get display name: firstName + lastName if available, otherwise email prefix
    const getDisplayName = () => {
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName} ${userProfile.lastName}`;
        }
        return user?.email?.split("@")[0] || "";
    };

    // Get user initials for avatar fallback
    const getUserInitials = (email?: string | null) => {
        if (userProfile?.firstName && userProfile?.lastName) {
            return `${userProfile.firstName.charAt(0)}${userProfile.lastName.charAt(0)}`.toUpperCase();
        }
        if (!email) return "U";
        return email.charAt(0).toUpperCase();
    };

    const navigationLinks = [
        { href: "/", label: "Accueil", icon: Home },
        { href: "/grades", label: "Notes", icon: FileText },
        { href: "/statistics", label: "Statistiques", icon: BarChart3 },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="flex h-16 items-center justify-between px-4">
                {/* Left - Logo and Title */}
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-primary" />
                    <Link href="/" className="flex items-center space-x-2">
                        <span className="text-xl font-bold">MyEFREI Grades</span>
                    </Link>
                </div>

                {/* Center - Navigation Links (Desktop) */}
                <div className="hidden md:flex items-center gap-6">
                    {navigationLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                            >
                                <Icon className="h-4 w-4" />
                                {link.label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right - User Dropdown Menu and Mobile Menu */}
                <div className="flex items-center gap-2">
                    {/* Mobile Menu Button */}
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild className="md:hidden">
                            <Button variant="ghost" size="icon">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-75 sm:w-100">
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    Navigation
                                </SheetTitle>
                            </SheetHeader>
                            <div className="mt-6 flex flex-col gap-4">
                                {/* User info in mobile menu */}
                                {status === "loading" && (
                                    <div className="flex items-center gap-3 pb-4 border-b">
                                        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                                        <div className="flex flex-col gap-2">
                                            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                                        </div>
                                    </div>
                                )}
                                {user && (
                                    <div className="flex items-center gap-3 pb-4 border-b">
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage src={user.image || ""} alt={user.email || "User"} />
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {getUserInitials(user.email)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <p className="text-sm font-medium">
                                                {getDisplayName()}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Navigation Links */}
                                {navigationLinks.map((link) => {
                                    const Icon = link.icon;
                                    return (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            onClick={() => setIsOpen(false)}
                                            className="flex items-center gap-3 text-base font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-accent"
                                        >
                                            <Icon className="h-5 w-5" />
                                            {link.label}
                                        </Link>
                                    );
                                })}

                                {/* User menu items */}
                                {user && (
                                    <Fragment>
                                        <div className="flex flex-col gap-2">
                                            {isAdmin && (
                                                <>
                                                    <Link
                                                        href="/admin/year-templates"
                                                        onClick={() => setIsOpen(false)}
                                                        className="flex items-center gap-3 text-base font-medium transition-colors text-primary hover:text-primary/80 p-2 rounded-md hover:bg-accent"
                                                    >
                                                        <Shield className="h-5 w-5" />
                                                        Administration
                                                    </Link>
                                                    <div className="h-px bg-border my-2" />
                                                </>
                                            )}
                                            <Link
                                                href="/profile"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 text-base font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-accent"
                                            >
                                                Profil
                                            </Link>
                                            <Link
                                                href="/settings"
                                                onClick={() => setIsOpen(false)}
                                                className="flex items-center gap-3 text-base font-medium transition-colors hover:text-primary p-2 rounded-md hover:bg-accent"
                                            >
                                                Paramètres
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setIsOpen(false);
                                                    signOut();
                                                }}
                                                className="w-full flex items-center gap-3 text-base font-medium transition-colors text-red-600 hover:text-red-700 p-2 rounded-md hover:bg-accent text-left"
                                            >
                                                Se déconnecter
                                            </button>
                                        </div>
                                    </Fragment>
                                )}

                                {!user && status !== "loading" && (
                                    <Button
                                        onClick={() => {
                                            setIsOpen(false);
                                            signIn("google");
                                        }}
                                        className="flex items-center gap-3 text-base font-medium transition-colors hover:text-primary"
                                    >
                                        Se connecter avec Google
                                    </Button>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>

                    {/* Desktop User Dropdown */}
                    {status === "loading" ? (
                        <div className="hidden md:flex items-center gap-2">
                            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                            <div className="hidden lg:block h-4 w-20 bg-muted animate-pulse rounded" />
                        </div>
                    ) : user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger className="hidden md:flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 cursor-pointer">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={user.image || ""} alt={user.email || "User"} />
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        {getUserInitials(user.email)}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden lg:block text-sm font-medium">
                                    {getDisplayName()}
                                </span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">
                                            {getDisplayName()}
                                        </p>
                                        <p className="text-xs leading-none text-muted-foreground">
                                            {user.email}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {isAdmin && (
                                    <>
                                        <DropdownMenuItem asChild className="cursor-pointer">
                                            <Link href="/admin/year-templates" className="flex items-center gap-2">
                                                <Shield className="h-4 w-4" />
                                                Administration
                                            </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                    </>
                                )}
                                <DropdownMenuItem className={"cursor-pointer"}>
                                    Profil
                                </DropdownMenuItem>
                                <DropdownMenuItem className={"cursor-pointer"}>
                                    Paramètres
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600 p-0">
                                    <Button variant="ghost" onClick={() => signOut()} className="w-full text-left cursor-pointer h-8">
                                        Se déconnecter
                                    </Button>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button
                            onClick={() => signIn("google")}
                            className="hidden md:inline-block text-sm font-medium transition-colors cursor-pointer"
                        >
                            Se connecter avec Google
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;