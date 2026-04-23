"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, User, Mail, Bell, Shield, Palette, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dispatchProfileUpdated } from "@/lib/profile-events"
import type { Profile } from "@/types/database"

async function parseError(res: Response): Promise<string> {
  try {
    const j = await res.json()
    if (typeof j?.error === "string") return j.error
  } catch {
    /* ignore */
  }
  return res.statusText || "Request failed"
}

export default function SettingsPage() {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  const [fullName, setFullName] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [email, setEmail] = useState("")

  const loadProfile = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/user/profile", {
        credentials: "same-origin",
        cache: "no-store",
      })
      if (!res.ok) {
        setLoadError(await parseError(res))
        return
      }
      const data = (await res.json()) as Profile
      setFullName(data.full_name ?? "")
      setBio(data.bio ?? "")
      setAvatarUrl(data.avatar_url ?? "")
      setEmail(data.email ?? "")
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load profile")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const handleSaveProfile = async () => {
    setSaveError(null)
    setSaveOk(false)
    setIsSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        }),
      })
      if (!res.ok) {
        setSaveError(await parseError(res))
        return
      }
      const data = (await res.json()) as Profile
      setFullName(data.full_name ?? "")
      setBio(data.bio ?? "")
      setAvatarUrl(data.avatar_url ?? "")
      setEmail(data.email ?? "")
      setSaveOk(true)
      dispatchProfileUpdated()
      setTimeout(() => setSaveOk(false), 4000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Save failed")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "appearance", label: "Appearance", icon: Palette },
  ] as const

  return (
    <main className="ml-0 flex min-h-[100dvh] min-h-screen w-full min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 shrink-0 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4 py-4 pl-14 pr-4 sm:pr-6 lg:pl-6 lg:pr-8">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl">Settings</h1>
              <p className="text-xs text-muted-foreground sm:text-sm">Manage your account preferences</p>
            </div>
          </div>
        </header>

        {/* Full-width shell: fixed-width settings nav + fluid panel (matches dashboard/projects) */}
        <div className="w-full min-w-0 flex-1 px-4 py-6 pb-10 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto grid w-full min-w-0 max-w-[1600px] grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(13rem,16.5rem)_minmax(0,1fr)] lg:items-start xl:gap-10">
            {/* Tab navigation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="min-w-0 w-full lg:max-w-none"
            >
              <Card className="border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
                <CardContent className="p-2 sm:p-3 lg:p-2">
                  <nav
                    aria-label="Settings sections"
                    className="flex flex-row gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0 [scrollbar-width:thin]"
                  >
                    {tabs.map((tab) => {
                      const Icon = tab.icon
                      const isActive = activeTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex w-full min-w-[9rem] shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors lg:min-w-0 ${
                            isActive
                              ? "bg-cinematic-orange/20 text-cinematic-orange ring-1 ring-cinematic-orange/25"
                              : "text-muted-foreground hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" aria-hidden />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </motion.div>

            {/* Main settings panel */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="min-w-0 w-full"
            >
              {activeTab === "profile" && (
                <Card className="border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
                  <CardHeader className="space-y-2 px-5 pb-4 pt-6 sm:px-8 sm:pb-5 sm:pt-8">
                    <CardTitle className="text-lg font-semibold text-white sm:text-xl">Profile information</CardTitle>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Name, bio, and avatar are stored in your profile. Email is managed by your sign-in provider.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-8 px-5 pb-8 pt-0 sm:px-8 sm:pb-10">
                    {loadError && (
                      <div
                        className="flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between"
                        role="alert"
                      >
                        <span className="min-w-0">{loadError}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="shrink-0 border-red-500/40"
                          onClick={() => void loadProfile()}
                        >
                          Retry
                        </Button>
                      </div>
                    )}
                    {saveError && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
                        {saveError}
                      </div>
                    )}
                    {saveOk && (
                      <div className="rounded-lg border border-green-500/40 bg-green-500/10 px-4 py-3 text-sm text-green-200">
                        Profile saved.
                      </div>
                    )}

                    {loading ? (
                      <div className="flex items-center gap-2 py-8 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading profile…
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-cinematic-orange/15">
                            {avatarUrl.trim() ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={avatarUrl.trim()} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-12 w-12 text-cinematic-orange" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-medium text-white">Profile photo</p>
                            <p className="text-xs text-muted-foreground">Paste an image URL below, or use the button to jump to the field.</p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="mt-2 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                              onClick={() => avatarInputRef.current?.focus()}
                            >
                              Change avatar URL
                            </Button>
                          </div>
                        </div>

                        <div className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-7">
                          <div className="min-w-0 space-y-2 sm:col-span-2">
                            <label htmlFor="settings-full-name" className="text-sm font-medium text-white">
                              Full name
                            </label>
                            <Input
                              id="settings-full-name"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              className="h-11 w-full min-w-0 bg-white/5 border-white/10 text-base sm:text-sm"
                              autoComplete="name"
                            />
                          </div>

                          <div className="min-w-0 space-y-2 sm:col-span-2">
                            <label htmlFor="settings-email" className="text-sm font-medium text-white">
                              Email
                            </label>
                            <div className="flex min-w-0 w-full items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3">
                              <Mail className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                              <Input
                                id="settings-email"
                                type="email"
                                value={email}
                                readOnly
                                className="h-11 min-w-0 flex-1 cursor-not-allowed border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 opacity-90"
                              />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              To change email, use your sign-in provider account settings.
                            </p>
                          </div>

                          <div className="min-w-0 space-y-2 sm:col-span-2">
                            <label htmlFor="settings-avatar" className="text-sm font-medium text-white">
                              Avatar image URL
                            </label>
                            <Input
                              ref={avatarInputRef}
                              id="settings-avatar"
                              value={avatarUrl}
                              onChange={(e) => setAvatarUrl(e.target.value)}
                              placeholder="https://…"
                              className="h-11 w-full min-w-0 bg-white/5 border-white/10 text-base sm:text-sm"
                            />
                          </div>

                          <div className="min-w-0 space-y-2 sm:col-span-2">
                            <label htmlFor="settings-bio" className="text-sm font-medium text-white">
                              Bio
                            </label>
                            <textarea
                              id="settings-bio"
                              rows={5}
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                              className="min-h-[8rem] w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-muted-foreground resize-y"
                              placeholder="Tell us about yourself…"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-white/10 pt-8">
                          <Button
                            type="button"
                            onClick={() => void handleSaveProfile()}
                            disabled={isSaving || !!loadError}
                            className="h-11 min-h-[44px] min-w-[8rem] bg-cinematic-orange text-black hover:bg-cinematic-orange/90"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving…
                              </>
                            ) : (
                              "Save changes"
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "notifications" && (
                <Card className="border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
                  <CardHeader className="px-5 pt-6 sm:px-8 sm:pt-8">
                    <CardTitle className="text-lg font-semibold text-white sm:text-xl">Notification preferences</CardTitle>
                    <p className="text-sm text-amber-200/80">
                      Not stored yet — these toggles are previews until notification settings ship.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 px-5 pb-8 sm:px-8 sm:pb-10">
                    {[
                      { label: "Email notifications", desc: "Project and account updates" },
                      { label: "Marketing", desc: "News and offers" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-4 border-b border-white/5 py-3 last:border-0 opacity-60"
                      >
                        <div className="min-w-0">
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                        <input type="checkbox" className="h-4 w-4 shrink-0 rounded" disabled defaultChecked aria-disabled />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {activeTab === "security" && (
                <Card className="border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
                  <CardHeader className="px-5 pt-6 sm:px-8 sm:pt-8">
                    <CardTitle className="text-lg font-semibold text-white sm:text-xl">Security</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Password and 2FA are managed by your authentication provider, not on this screen.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3 px-5 pb-8 text-sm text-muted-foreground sm:px-8 sm:pb-10">
                    <p>Use the sign-in page &quot;Forgot password&quot; to reset your password. Account security is managed through your email provider and Supabase Auth.</p>
                  </CardContent>
                </Card>
              )}

              {activeTab === "appearance" && (
                <Card className="border-white/10 bg-[#0f0f0f]/80 backdrop-blur-sm">
                  <CardHeader className="px-5 pt-6 sm:px-8 sm:pt-8">
                    <CardTitle className="text-lg font-semibold text-white sm:text-xl">Appearance</CardTitle>
                    <p className="text-sm text-amber-200/80">Theme and language are not saved yet.</p>
                  </CardHeader>
                  <CardContent className="pointer-events-none space-y-4 px-5 pb-8 opacity-60 sm:px-8 sm:pb-10">
                    <p className="text-sm text-muted-foreground">Dark mode is the default across the app today.</p>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </div>
        </div>
    </main>
  )
}
