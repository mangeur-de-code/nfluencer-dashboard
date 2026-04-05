import { SignIn } from "@clerk/react";

export default function SignInForm() {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full">
      <SignIn routing="path" path="/signin" />
    </div>
  );
}
