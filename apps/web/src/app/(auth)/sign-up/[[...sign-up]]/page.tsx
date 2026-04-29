import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Content Pipeline</h1>
          <p className="text-zinc-400 mt-2">Start turning ideas into posted videos.</p>
        </div>
        <SignUp />
      </div>
    </div>
  );
}
