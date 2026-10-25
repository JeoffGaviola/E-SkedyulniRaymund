import { useState } from "react"
import { BackButton, Button, Card, InputField, Logo, ScreenShell } from "../../shared/ui"

const ADMIN_USERNAME = "admin"
const ADMIN_PASSWORD = "admin123"

export function AdminLoginScreen({ onBack, onAuthenticated }: {
  onBack: () => void
  onAuthenticated: () => void
}) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  function signIn() {
    if (!username.trim() || !password) {
      setError("Enter your username and password.")
      return
    }
    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError("The username or password is incorrect.")
      return
    }
    setError("")
    onAuthenticated()
  }

  return (
    <ScreenShell>
      <BackButton onClick={onBack} />
      <div className="mb-7 flex justify-center">
        <Logo size="md" />
      </div>
      <Card>
        <div className="border-b border-border pb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gold">Administration</p>
          <p className="mt-2 text-2xl font-bold text-navy">Admin sign in</p>
          <p className="mt-2 text-base leading-relaxed text-muted">
            Sign in with your administrator account to manage organizations and events.
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-5">
          <InputField
            id="admin-username"
            label="Username"
            value={username}
            onChange={value => {
              setUsername(value)
              setError("")
            }}
            placeholder="Enter username"
            autoComplete="username"
          />
          <InputField
            id="admin-password"
            label="Password"
            type="password"
            value={password}
            onChange={value => {
              setPassword(value)
              setError("")
            }}
            placeholder="Enter password"
            autoComplete="current-password"
          />
          {error && (
            <p role="alert" className="rounded-xl bg-red-light p-4 text-sm font-semibold text-red">
              {error}
            </p>
          )}
          <Button onClick={signIn}>Sign in to admin</Button>
        </div>
      </Card>
      <p className="mt-5 text-center text-sm leading-relaxed text-muted">
        This workspace is restricted to authorized administrators.
      </p>
    </ScreenShell>
  )
}
