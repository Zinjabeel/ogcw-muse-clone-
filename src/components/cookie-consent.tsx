import { Link } from "@tanstack/react-router";
import { BarChart3, ChevronRight, CookieIcon, Globe, Palette, Shield, Target } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { readConsent, saveConsent } from "@/lib/consent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { T } from "./site-text";

// Cookie consent, in the layout of 21st.dev's "cookie-consent" (bankkroll):
// a card bottom left with Accept All and Customize, and a Manage Cookies
// dialog with a switch per category. OGCW keeps only what it needs: the
// essentials (this choice, the language) and, if the reader allows it,
// preferences (colour theme, hero, votes and answers). There are no
// analytics or advertising cookies, so those are shown as not used rather
// than offered (src/lib/consent.ts keeps the choice). "Cookie settings" in
// the footer and the menu opens the dialog again.

export const LANGUAGES = [{ code: "en", name: "English", native: "English" }] as const;

type Category = { id: string; name: string; description: string; icon: ReactNode; essential?: boolean; unused?: boolean };

const CATEGORIES: Category[] = [
  { id: "essential", name: "Essential cookies", description: "Remember this choice and your language. The site needs these to work, so they can’t be turned off.", icon: <Shield className="h-4 w-4" />, essential: true },
  { id: "preferences", name: "Preferences", description: "Your colour theme, your choice of home page hero, and the votes and answers you’ve given, so you see the results when you come back.", icon: <Palette className="h-4 w-4" /> },
  { id: "analytics", name: "Analytics", description: "Not used. OGCW doesn’t measure your visits with analytics cookies.", icon: <BarChart3 className="h-4 w-4" />, unused: true },
  { id: "marketing", name: "Marketing", description: "Not used. OGCW doesn’t use advertising or tracking cookies.", icon: <Target className="h-4 w-4" />, unused: true },
];

export function CookieConsent() {
  const [mounted, setMounted] = useState(false);
  const [banner, setBanner] = useState<"hidden" | "shown" | "leaving">("hidden");
  const [dialog, setDialog] = useState(false);
  const [preferences, setPreferences] = useState(true);

  // First visit: the card slides in once the page has settled
  useEffect(() => {
    setMounted(true);
    const saved = readConsent();
    if (saved) { setPreferences(saved.preferences); return; }
    const timer = window.setTimeout(() => setBanner("shown"), 500);
    return () => window.clearTimeout(timer);
  }, []);

  // "Cookie settings" anywhere on the site opens the dialog again
  useEffect(() => {
    const reopen = () => { setPreferences(readConsent()?.preferences ?? true); setDialog(true); };
    window.addEventListener("ogcw-open-consent", reopen);
    return () => window.removeEventListener("ogcw-open-consent", reopen);
  }, []);

  const choose = (allow: boolean) => {
    saveConsent(allow);
    setPreferences(allow);
    setDialog(false);
    setBanner((state) => (state === "shown" ? "leaving" : state));
  };
  useEffect(() => {
    if (banner !== "leaving") return;
    const timer = window.setTimeout(() => setBanner("hidden"), 400);
    return () => window.clearTimeout(timer);
  }, [banner]);

  if (!mounted) return null;
  return (
    <>
      {banner !== "hidden" && (
        <CookieBanner leaving={banner === "leaving"} onAcceptAll={() => choose(true)} onCustomize={() => setDialog(true)} />
      )}
      <CookieDialog
        open={dialog}
        onOpenChange={setDialog}
        preferences={preferences}
        onToggle={setPreferences}
        onSave={() => choose(preferences)}
        onRejectAll={() => choose(false)}
      />
    </>
  );
}

function CookieBanner({ leaving, onAcceptAll, onCustomize }: { leaving: boolean; onAcceptAll: () => void; onCustomize: () => void }) {
  return (
    <div className={cn("cookie-banner fixed bottom-0 left-0 right-0 z-50 w-full sm:bottom-4 sm:left-4 sm:max-w-md", leaving && "is-leaving")} role="region" aria-label="Cookie preferences">
      <div className="m-3 rounded-xl border border-border/50 bg-card shadow-2xl">
        <div className="flex items-center gap-3 p-6 pb-4">
          <div className="rounded-lg bg-primary/10 p-2">
            <CookieIcon className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <h2 className="cookie-title text-lg font-semibold"><T k="cookies.title">Cookie Preferences</T></h2>
        </div>
        <div className="px-6 pb-4">
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            <T k="cookies.copy">We use a few small cookies to make the site work and, if you allow it, to remember your preferences. No tracking, no ads.</T>
          </p>
          <Link to="/info/$slug" params={{ slug: "cookies" }} className="group inline-flex items-center text-xs font-medium text-primary transition-colors hover:underline">
            <T k="cookies.policy">Cookie Policy</T>
            <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
        <div className="flex flex-col gap-3 rounded-b-xl border-t border-border/50 bg-muted/30 p-4 sm:flex-row">
          <Button onClick={onAcceptAll} size="sm" className="h-9 w-full rounded-lg text-sm transition-all hover:shadow-md sm:flex-1">
            <T k="cookies.accept">Accept All</T>
          </Button>
          <Button onClick={onCustomize} size="sm" variant="outline" className="h-9 w-full rounded-lg text-sm transition-all hover:shadow-md sm:flex-1">
            <T k="cookies.customize">Customize</T>
          </Button>
        </div>
      </div>
    </div>
  );
}

function CookieDialog({ open, onOpenChange, preferences, onToggle, onSave, onRejectAll }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preferences: boolean;
  onToggle: (value: boolean) => void;
  onSave: () => void;
  onRejectAll: () => void;
}) {
  const isOn = (category: Category) => (category.essential ? true : category.unused ? false : preferences);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[200] gap-0 border-border/50 bg-card/95 p-0 shadow-2xl backdrop-blur-lg sm:max-w-[500px]">
        <DialogHeader className="border-b border-border/50 p-6 pb-4">
          <DialogTitle className="cookie-title text-xl font-semibold"><T k="cookies.manage">Manage Cookies</T></DialogTitle>
          <DialogDescription className="text-muted-foreground"><T k="cookies.manage.copy">Choose what OGCW may keep in this browser. You can change this any time from “Cookie settings” in the footer.</T></DialogDescription>
        </DialogHeader>
        <div className="max-h-[calc(100vh-250px)] space-y-4 overflow-y-auto px-6 py-6">
          <label className="cookie-lang flex items-center justify-between gap-3 rounded-xl border border-border/50 p-4">
            <span className="flex items-center gap-3 text-sm font-semibold"><span className="rounded-lg bg-muted p-2"><Globe className="h-4 w-4" aria-hidden="true" /></span><T k="cookies.language">Language</T></span>
            <select defaultValue="en" aria-label="Language" className="rounded-md border border-border bg-background px-2 py-1 text-sm">
              {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.native}</option>)}
            </select>
          </label>
          {CATEGORIES.map((category, index) => {
            const on = isOn(category);
            return (
              <div
                key={category.id}
                className={cn("cookie-cat rounded-xl border p-4 transition-all duration-200", on ? "border-primary/30 bg-primary/5 shadow-sm" : "border-border/50 hover:border-border/70", category.unused && "opacity-70")}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("rounded-lg p-2 transition-colors", on ? "bg-primary/10 text-primary" : "bg-muted")}>{category.icon}</div>
                    <Label htmlFor={`cookie-${category.id}`} className="cursor-pointer text-base font-semibold">
                      <T>{category.name}</T>
                      {(category.essential || category.unused) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{category.essential ? "Required" : "Not used"}</span>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{category.essential ? "These cookies can’t be turned off." : "OGCW doesn’t use these at all."}</p></TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </Label>
                  </div>
                  <Switch
                    id={`cookie-${category.id}`}
                    checked={on}
                    onCheckedChange={(checked) => { if (!category.essential && !category.unused) onToggle(checked); }}
                    disabled={category.essential || category.unused}
                  />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground"><T>{category.description}</T></p>
              </div>
            );
          })}
        </div>
        <DialogFooter className="rounded-b-lg border-t border-border/50 bg-muted/30 p-6">
          <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={onRejectAll} className="min-w-[120px] transition-all hover:shadow-md"><T k="cookies.reject">Reject All</T></Button>
            <Button onClick={onSave} className="min-w-[140px] transition-all hover:shadow-md"><T k="cookies.save">Save Preferences</T></Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** The language menu in the footer: English is the only language for now */
export function LanguagePicker() {
  return (
    <label className="lang-picker">
      <Globe size={15} strokeWidth={1.75} aria-hidden="true" />
      <span className="sr-only"><T>Language</T></span>
      <select defaultValue="en" aria-label="Language">
        {LANGUAGES.map((language) => <option key={language.code} value={language.code}>{language.native}</option>)}
      </select>
    </label>
  );
}
