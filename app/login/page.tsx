import { LoginForm } from "@/components/auth/login-form"
import { DebugUsers } from "@/components/auth/debug-users"
import { CreateTestUser } from "@/components/auth/create-test-user"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Sistema de Contabilidad RD</h1>
        <LoginForm />
        <CreateTestUser />
        <DebugUsers />
      </div>
    </div>
  )
}
