import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import BrandShield from "@/components/BrandShield";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <Link
          to="/"
          aria-label="MetaScrub home"
          className="mb-6 inline-flex items-center justify-center gap-2 rounded-md text-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <BrandShield size="lg" alt="" />
          <span className="text-lg font-bold tracking-tight">
            Meta<span className="text-primary">Scrub</span>
          </span>
        </Link>
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <Link to="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
