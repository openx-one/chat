import { Metadata } from "next"
import Link from "next/link"
import { UserAuthForm } from "@/components/auth/auth-form"
import { Circle } from "lucide-react"

export const metadata: Metadata = {
  title: "Log In - Openx",
  description: "Log in to your account.",
}

export default function LoginPage() {
  return (
    <div className="container relative h-screen w-full flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 bg-black overflow-hidden">
      {/* LEFT PANEL */}
      <div className="relative hidden h-full flex-col p-10 text-white lg:flex justify-center items-center">
        {/* Dark base */}
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        
        {/* Purple Glow Background matching the reference image */}
        <div className="absolute top-0 left-0 w-full h-[60%] bg-gradient-to-b from-purple-600/40 to-transparent blur-[100px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[80%] h-[70%] bg-purple-700/20 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

        <div className="relative z-20 flex flex-col items-center w-full max-w-[320px] mt-[-10vh]">
          <div className="flex items-center gap-2.5 text-lg font-medium mb-10">
            <Circle className="h-5 w-5 fill-white text-white" />
            <span className="font-semibold text-xl tracking-wide">Openx</span>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight mb-3">Get Started with Us</h1>
          <p className="text-center text-neutral-400 text-sm mb-12 max-w-[280px]">
            Complete these easy steps to register your account.
          </p>

          <div className="w-full flex flex-col gap-4">
            {/* Step 1 */}
            <div className="flex items-center gap-4 bg-white border border-white/10 rounded-xl p-4 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <div className="h-6 w-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold">1</div>
              <span className="font-medium text-black">Sign up your account</span>
            </div>
            
            {/* Step 2 */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="h-6 w-6 rounded-full bg-[#1a1a1a] text-neutral-500 flex items-center justify-center text-xs font-bold border border-white/5">2</div>
              <span className="font-medium text-neutral-400">Set up your workspace</span>
            </div>
            
            {/* Step 3 */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/5 rounded-xl p-4">
              <div className="h-6 w-6 rounded-full bg-[#1a1a1a] text-neutral-500 flex items-center justify-center text-xs font-bold border border-white/5">3</div>
              <span className="font-medium text-neutral-400">Set up your profile</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* RIGHT PANEL - LOGIN FORM */}
      <div className="lg:p-8 flex items-center justify-center h-full bg-black">
        <div className="mx-auto flex w-full flex-col justify-center space-y-8 sm:w-[400px]">
          <div className="flex flex-col space-y-3 text-center mb-4">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Log In Account
            </h1>
            <p className="text-sm text-neutral-400">
              Log in to your account using your preferred method.
            </p>
          </div>
          <UserAuthForm view="login" />
          
          <p className="px-8 text-center text-sm text-neutral-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-white hover:underline underline-offset-4"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
