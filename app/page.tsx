import { LoginForm } from "@/components/auth/login-form"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-blue-800">ContaDom</h1>
          <p className="mt-2 text-gray-600">Sistema de Contabilidad para República Dominicana</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

