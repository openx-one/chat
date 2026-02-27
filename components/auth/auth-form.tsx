/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import * as React from "react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <g clipPath="url(#clip0_24_32)">
        <path d="M23.4928 12.2741C23.4928 11.4116 23.4241 10.608 23.2797 9.83838H12V14.4449H18.468C18.1824 15.9392 17.3392 17.2025 16.0844 18.0457V21.0371H19.9575C22.227 18.9419 23.4928 15.8953 23.4928 12.2741Z" fill="#4285F4"/>
        <path d="M12.0001 23.9997C15.2343 23.9997 17.9398 22.9248 19.9577 21.0371L16.0846 18.0457C14.9943 18.7847 13.6089 19.2319 12.0001 19.2319C8.88785 19.2319 6.25585 17.1367 5.30456 14.3168H1.32135V17.4082C3.2842 21.3093 7.32766 23.9997 12.0001 23.9997Z" fill="#34A853"/>
        <path d="M5.30472 14.3168C5.05381 13.5779 4.91269 12.8005 4.91269 12.0004C4.91269 11.2003 5.05381 10.4229 5.30472 9.68393V6.59253H1.32151C0.50974 8.20456 0.0410156 10.0402 0.0410156 12.0004C0.0410156 13.9606 0.50974 15.7963 1.32151 17.4083L5.30472 14.3168Z" fill="#FBBC05"/>
        <path d="M12.0001 4.7679C13.7659 4.7679 15.3404 5.37563 16.5916 6.55198L20.0487 3.09489C17.9365 1.12799 15.2311 0 12.0001 0C7.32766 0 3.2842 2.69041 1.32135 6.5925L5.30456 9.6839C6.25585 6.86407 8.88785 4.7679 12.0001 4.7679Z" fill="#EA4335"/>
    </g>
    <defs>
        <clipPath id="clip0_24_32">
            <rect width="24" height="24" fill="white"/>
        </clipPath>
    </defs>
  </svg>
)

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
    view: "login" | "signup"
}

export function UserAuthForm({ className, view, ...props }: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState<string | null>(null)
  const [showOtpInput, setShowOtpInput] = React.useState<boolean>(false)
  const [email, setEmail] = React.useState<string>("")

  const supabase = createClient()

  async function handleSendOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    const target = event.target as typeof event.target & {
      email: { value: string }
    }
    const emailValue = target.email.value

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email: emailValue,
            options: {
                emailRedirectTo: `${window.location.origin}/`,
                shouldCreateUser: view === "signup"
            },
        })
        if (error) throw error
        setEmail(emailValue)
        setShowOtpInput(true)
        setSuccess("Check your email for the 6-digit code.")
    } catch (err: any) {
        setError(err.message || "Something went wrong")
    } finally {
        setIsLoading(false)
    }
  }

  async function handleVerifyOtp(event: React.SyntheticEvent) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const target = event.target as typeof event.target & {
      code: { value: string }
    }
    const token = target.code.value

    try {
        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email'
        })
        if (error) throw error
        // Success: Supabase redirects or stays logged in depending on setup
        window.location.href = "/"
    } catch (err: any) {
        setError(err.message || "Invalid or expired code")
    } finally {
        setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
      setIsLoading(true);
      await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: `${window.location.origin}/auth/callback`,
          }
      });
  }

  return (
    <div className={cn("grid gap-6 w-full", className)} {...props}>
        
      {!showOtpInput && (
        <>
            <Button 
                variant="outline" 
                type="button" 
                disabled={isLoading} 
                onClick={handleGoogleLogin} 
                className="bg-[#121212] border-white/10 hover:bg-[#1a1a1a] text-white/90 h-11 w-full"
            >
                <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
            </Button>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-4 text-neutral-500">
                        Or
                    </span>
                </div>
            </div>

            <form onSubmit={handleSendOtp}>
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label className="text-sm text-neutral-300 font-medium" htmlFor="email">
                            Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            placeholder="eg. johnfrans@gmail.com"
                            type="email"
                            autoCapitalize="none"
                            autoComplete="email"
                            autoCorrect="off"
                            disabled={isLoading}
                            required
                            className="bg-[#121212] border-transparent focus-visible:ring-1 focus-visible:ring-white/20 text-white placeholder:text-neutral-600 h-11 rounded-lg"
                        />
                    </div>
                    
                    {error && (
                        <p className="text-xs text-red-500 font-medium text-center">{error}</p>
                    )}
                    
                    <Button disabled={isLoading} className="w-full bg-white text-black hover:bg-neutral-200 h-11 font-semibold rounded-lg text-[15px]">
                        {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {view === "signup" ? "Sign Up" : "Continue"}
                    </Button>
                </div>
            </form>
        </>
      )}

      {showOtpInput && (
        <form onSubmit={handleVerifyOtp}>
            <div className="grid gap-6">
                <div className="flex items-center">
                    <button 
                        type="button" 
                        onClick={() => setShowOtpInput(false)}
                        className="text-neutral-500 hover:text-white transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="ml-4">
                        <h2 className="text-sm font-medium text-white">Enter code</h2>
                        <p className="text-xs text-neutral-500">Sent to {email}</p>
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label className="text-sm text-neutral-300 font-medium" htmlFor="code">
                        6-digit code
                    </Label>
                    <Input
                        id="code"
                        name="code"
                        placeholder="000000"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="one-time-code"
                        disabled={isLoading}
                        required
                        autoFocus
                        className="bg-[#121212] border-transparent focus-visible:ring-1 focus-visible:ring-white/20 text-white placeholder:text-neutral-600 h-11 rounded-lg text-center tracking-[1em] font-mono text-lg"
                    />
                </div>
                
                {error && (
                    <p className="text-xs text-red-500 font-medium text-center">{error}</p>
                )}
                {success && (
                    <p className="text-xs text-green-500 font-medium text-center">{success}</p>
                )}

                <Button disabled={isLoading} className="w-full bg-white text-black hover:bg-neutral-200 h-11 font-semibold rounded-lg text-[15px]">
                    {isLoading && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Verify & Login
                </Button>

                <p className="text-center text-xs text-neutral-500">
                    Didn&apos;t receive it?{" "}
                    <button 
                        type="button" 
                        onClick={() => handleSendOtp({ preventDefault: () => {}, target: { email: { value: email } } } as any)}
                        className="text-white hover:underline underline-offset-4"
                    >
                        Resend code
                    </button>
                </p>
            </div>
        </form>
      )}
    </div>
  )
}
