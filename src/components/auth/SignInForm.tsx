import { Link } from "react-router";
import { ChevronLeftIcon } from "../../icons";
import Button from "../ui/button/Button";

export default function SignInForm() {
  const handleSignIn = () => {
    // Redirect to main app for Clerk authentication, then back to dashboard
    const dashboardUrl = encodeURIComponent(globalThis.location.origin);
    globalThis.location.href = `https://www.nfluencer.co/auth/clerk-signin?redirect_url=${dashboardUrl}`;
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon className="size-5" />
          Back to dashboard
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Admin Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in with your account to access the admin dashboard.
            </p>
          </div>
          <div>
            <Button className="w-full" size="sm" onClick={handleSignIn}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
