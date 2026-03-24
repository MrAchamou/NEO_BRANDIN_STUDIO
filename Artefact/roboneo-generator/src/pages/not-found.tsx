import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <h1 className="text-8xl font-serif font-bold text-primary">404</h1>
        <h2 className="text-2xl font-medium">Page introuvable</h2>
        <p className="text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="pt-4">
          <Link href="/" className="inline-block">
            <Button variant="luxury">Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
