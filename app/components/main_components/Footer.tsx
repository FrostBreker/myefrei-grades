import Link from "next/link";
import { GraduationCap, Github, Mail, Heart, Coffee } from "lucide-react";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t bg-background">
            <div className="px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-6 w-6 text-primary" />
                            <span className="text-lg font-bold">MyEFREI Grades</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Un petit projet étudiant pour rendre la vie plus facile aux étudiants EFREI.
                            Simple, gratuit, et fait avec ❤️
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Navigation</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">
                                    Accueil
                                </Link>
                            </li>
                            <li>
                                <Link href="/grades" className="text-muted-foreground hover:text-primary transition-colors">
                                    Mes Notes
                                </Link>
                            </li>
                            <li>
                                <Link href="/statistics" className="text-muted-foreground hover:text-primary transition-colors">
                                    Statistiques
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Legal Links */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Infos légales</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                                    Vie privée
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                                    Conditions d&apos;utilisation
                                </Link>
                            </li>
                            <li>
                                <Link href="/legal" className="text-muted-foreground hover:text-primary transition-colors">
                                    Mentions légales
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="space-y-4">
                        <h3 className="font-semibold">Contact</h3>
                        <div className="flex gap-4">
                            <a
                                href="https://github.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label="GitHub"
                            >
                                <Github className="h-5 w-5" />
                            </a>
                            <a
                                href="mailto:donatien.faraut@efrei.net"
                                className="text-muted-foreground hover:text-primary transition-colors"
                                aria-label="Email"
                            >
                                <Mail className="h-5 w-5" />
                            </a>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Un bug ? Une idée ? Envoie-moi un message !
                        </p>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t">
                    {/* Disclaimer */}
                    <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                            ⚠️ <strong>Site non officiel</strong> - Ce projet n&apos;est pas affilié à l&apos;EFREI Paris.
                            C&apos;est une initiative étudiante indépendante.
                        </p>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-muted-foreground">
                            © {currentYear} MyEFREI Grades - Projet étudiant
                        </p>

                        {/* Support link */}
                        <a
                            href="https://paypal.me/frostbrekerdev"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-full text-sm font-medium transition-colors"
                        >
                            <Coffee className="h-4 w-4" />
                            Soutenir le projet
                        </a>

                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                            Fait avec <Heart className="h-4 w-4 text-red-500 fill-red-500" /> par un étudiant EFREI
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}