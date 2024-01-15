// page.tsx
import { auth } from '@/auth'
import { LoginButton } from '@/components/login-button'
import { redirect } from 'next/navigation'
import { IconGitHub, IconGoogle } from '@/components/ui/icons'

export default async function SignInPage() {
  const session = await auth()

  if (session?.user?.id) {
    redirect('/')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] items-center justify-center py-10">
      <LoginButton
        provider="github"
        text="Login with GitHub"
        icon={<IconGitHub className="mr-2" />}
      />
      <LoginButton
        provider="google"
        text="Login with Google"
        icon={<IconGoogle className="mr-2" />}
      />
    </div>
  )
}
