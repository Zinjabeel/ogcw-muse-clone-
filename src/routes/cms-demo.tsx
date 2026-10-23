import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, Eye, FileText, LayoutDashboard, Pencil, Plus, RotateCcw, Search, Settings, ShieldCheck, Trash2 } from "lucide-react";

// A self-contained showcase. No Sanity client, server functions, cookies or write endpoints.
// Edits live only in React state and are discarded on refresh.
type DemoStory = { id: number; title: string; category: string; status: "Published" | "Draft"; excerpt: string };
const initialStories: DemoStory[] = [
  { id: 1, title: "Inside the Culture: What's Moving Music Right Now", category: "Music", status: "Published", excerpt: "A look at the artists, communities and moments shaping the conversation." },
  { id: 2, title: "The Future of Streetwear and Collaboration", category: "Fashion", status: "Published", excerpt: "The creative partnerships pushing culture forward." },
  { id: 3, title: "Gaming's Next Era: Worlds Worth Exploring", category: "Gaming", status: "Draft", excerpt: "Fresh ideas and new experiences across the gaming community." },
  { id: 4, title: "The Moments That Defined Basketball Culture", category: "Sports", status: "Published", excerpt: "Where sports, fashion and music meet." },
];
const categories = ["Music", "Fashion", "Gaming", "Sports", "Culture", "Film & TV"];
export const Route = createFileRoute("/cms-demo")({
  head: () => ({ meta: [{ title: "CMS Demo — OGCW" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: CmsDemo,
});
function CmsDemo() {
  const [stories, setStories] = useState<DemoStory[]>(initialStories);
  const [selected, setSelected] = useState<number | null>(null);
  const [section, setSection] = useState<"stories" | "dashboard" | "settings">("stories");
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const current = stories.find((s) => s.id === selected);
  const update = (change: Partial<DemoStory>) => {
    if (selected === null) return;
    setStories((previous) => previous.map((s) => s.id === selected ? { ...s, ...change } : s));
    setMessage("Changes are visible in this demo only.");
  };
  const reset = () => { setStories(initialStories); setSelected(null); setSection("stories"); setMessage("Demo reset. No real content was changed."); };
  return <div style={{ minHeight: "100vh", background: "#101113", color: "#efeee9", fontFamily: "Inter, Arial, sans-serif" }}>
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#f9d97a", color: "#171717", textAlign: "center", padding: "9px 16px", fontWeight: 750, fontSize: 12, letterSpacing: ".04em" }}>
      DEMO MODE · All changes are temporary · No content is saved to Sanity
    </div>
    <div style={{ display: "flex", minHeight: "calc(100vh - 35px)" }}>
      <aside style={{ width: 225, flexShrink: 0, borderRight: "1px solid #353535", padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
        <strong style={{ fontSize: 27, letterSpacing: "-.07em" }}>OGCW<span style={{ color: "#e1bd64" }}>.</span></strong>
        <span style={{ fontSize: 10, color: "#aaa", letterSpacing: ".18em", marginBottom: 28 }}>CONTENT STUDIO / DEMO</span>
        {([{ key: "dashboard", label: "Overview", Icon: LayoutDashboard }, { key: "stories", label: "Articles", Icon: FileText }, { key: "settings", label: "Settings", Icon: Settings }] as const).map(({ key, label, Icon }) =>
          <button key={key} onClick={() => {setSection(key); setSelected(null); setMessage("");}} style={{ display: "flex", alignItems: "center", gap: 12, background: section === key ? "#29271d" : "transparent", border: section === key ? "1px solid #6c5a30" : "1px solid transparent", color: section === key ? "#f6d27b" : "#c1c1c1", padding: "13px 10px", textAlign: "left", borderRadius: 8, cursor: "pointer" }}><Icon size={17}/>{label}</button>)}
        <div style={{ marginTop: "auto", borderTop: "1px solid #353535", paddingTop: 16 }}>
          <button onClick={reset} style={{ display: "flex", gap: 8, alignItems: "center", background: "none", color: "#ccc", border: 0, cursor: "pointer", marginBottom: 18 }}><RotateCcw size={16}/> Reset demo</button>
          <Link to="/work" style={{ display: "flex", gap: 8, color: "#f4d17b", textDecoration: "none", alignItems: "center" }}><ArrowLeft size={16}/> Exit demo</Link>
        </div>
      </aside>
      <main style={{ flex: 1, padding: "clamp(18px, 4vw, 52px)", minWidth: 0, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 34 }}>
          <div><div style={{ fontSize: 11, color: "#cfb46c", letterSpacing: ".15em", marginBottom: 9 }}>ONE GREAT CULTURE WORLD</div><h1 style={{ fontSize: "clamp(24px, 3vw, 36px)", margin: 0, fontWeight: 750 }}>{section === "dashboard" ? "Studio overview" : section === "settings" ? "Workspace settings" : current ? "Edit article" : "Content library"}</h1></div>
          <span style={{ display: "flex", alignItems: "center", gap: 7, border: "1px solid #615433", color: "#f3d283", borderRadius: 22, padding: "9px 13px", fontSize: 12 }}><ShieldCheck size={15}/> Safe demo</span>
        </div>
        {message && <p role="status" style={{ background: "#2d2a20", color: "#efcf81", padding: 13, borderRadius: 8 }}>{message}</p>}
        {section === "dashboard" && <div>
          <p style={{ color: "#a5a5a5" }}>A preview of the OGCW editorial workspace.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 15, marginTop: 25 }}>
            {[["Articles", stories.length],["Published", stories.filter(s=>s.status==="Published").length],["Drafts", stories.filter(s=>s.status==="Draft").length]].map(([label, value])=><div key={label} style={{ background: "#1d1e21", border: "1px solid #373737", padding: 24, borderRadius: 12 }}><div style={{ color: "#aaa" }}>{label}</div><div style={{ fontSize: 38, fontWeight: 750, marginTop: 12 }}>{value}</div></div>)}
          </div>
          <button onClick={()=>setSection("stories")} style={{ marginTop: 27, background: "#e9c96f", border: 0, padding: "12px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Manage articles →</button>
        </div>}
        {section === "settings" && <div style={{ background: "#1d1e21", border: "1px solid #373737", padding: 25, borderRadius: 12 }}><h2 style={{ marginTop: 0 }}>OGCW editorial workspace</h2><p style={{ color: "#bbb" }}>Demo configuration. Publishing, team permissions and integrations are intentionally disabled here.</p><p style={{ color: "#efcf81" }}>Real administration remains protected behind your existing login.</p></div>}
        {section === "stories" && !current && <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", marginBottom: 22 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 9, border: "1px solid #4d4d4d", background: "#1d1e21", padding: "8px 13px", borderRadius: 8 }}><Search size={18}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search articles" style={{ background: "transparent", border: 0, color: "#fff", outline: "none", width: 190 }}/></label>
            <button onClick={()=>{const id=Math.max(0,...stories.map(s=>s.id))+1;setStories(x=>[{id,title:"Untitled article",category:"Culture",status:"Draft",excerpt:"Start writing your story..."},...x]);setSelected(id);setMessage("New draft created in demo only.");}} style={{ display: "flex", alignItems: "center", gap: 8, background: "#e9c96f", border: 0, borderRadius: 8, padding: "11px 17px", fontWeight: 700, cursor: "pointer" }}><Plus size={17}/> New article</button>
          </div>
          <div style={{ background: "#1d1e21", border: "1px solid #373737", borderRadius: 12, overflow: "hidden" }}>
            {stories.filter(s=>s.title.toLowerCase().includes(search.toLowerCase())).map(s=><button key={s.id} onClick={()=>{setSelected(s.id);setMessage("");}} style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "center", gap: 16, background: "transparent", padding: "19px 22px", border: 0, borderBottom: "1px solid #353535", textAlign: "left", color: "#eee", cursor: "pointer" }}><span><strong style={{ display: "block", marginBottom: 6 }}>{s.title}</strong><span style={{ fontSize: 12, color: "#a9a9a9" }}>{s.category} · {s.status}</span></span><Pencil size={17}/></button>)}
          </div>
        </>}
        {section === "stories" && current && <div style={{ background: "#1d1e21", border: "1px solid #373737", borderRadius: 12, padding: "clamp(18px,3vw,32px)", maxWidth: 800 }}>
          <button onClick={()=>setSelected(null)} style={{ background: "transparent", border: 0, color: "#f1d083", cursor: "pointer", marginBottom: 22, display: "flex", gap: 8, alignItems: "center" }}><ArrowLeft size={17}/> All articles</button>
          <div style={{ display: "grid", gap: 19 }}>
            <label style={{ display: "grid", gap: 8, fontSize: 13, color: "#bdbdbd" }}>Title<input value={current.title} onChange={e=>update({title:e.target.value})} style={{ background: "#141517", border: "1px solid #505050", borderRadius: 7, padding: 13, color: "#fff", fontSize: 18 }}/></label>
            <label style={{ display: "grid", gap: 8, fontSize: 13, color: "#bdbdbd" }}>Category<select value={current.category} onChange={e=>update({category:e.target.value})} style={{ background: "#141517", border: "1px solid #505050", borderRadius: 7, padding: 13, color: "#fff" }}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
            <label style={{ display: "grid", gap: 8, fontSize: 13, color: "#bdbdbd" }}>Excerpt<textarea rows={6} value={current.excerpt} onChange={e=>update({excerpt:e.target.value})} style={{ background: "#141517", border: "1px solid #505050", borderRadius: 7, padding: 13, color: "#fff", resize: "vertical" }}/></label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <button onClick={()=>{update({status:current.status==="Published"?"Draft":"Published"});}} style={{ display: "flex", gap: 8, alignItems: "center", background: "#e9c96f", color: "#171717", border: 0, borderRadius: 7, padding: "12px 16px", fontWeight: 700, cursor: "pointer" }}><Check size={17}/> {current.status==="Published"?"Unpublish (demo)":"Publish (demo)"}</button>
              <button onClick={()=>setMessage("Preview only: your edits are visible here and have not been sent to the website.")} style={{ display: "flex", gap: 8, alignItems: "center", background: "#303136", border: 0, color: "#eee", borderRadius: 7, padding: "12px 16px", cursor: "pointer" }}><Eye size={17}/> Preview</button>
              <button onClick={()=>{setStories(prev=>prev.filter(s=>s.id!==current.id));setSelected(null);setMessage("Demo article removed. No real article was deleted.");}} style={{ display: "flex", gap: 8, alignItems: "center", background: "transparent", border: "1px solid #754848", color: "#eab3b3", borderRadius: 7, padding: "12px 16px", cursor: "pointer" }}><Trash2 size={17}/> Delete (demo)</button>
            </div>
          </div>
        </div>}
        <p style={{ marginTop: 30, color: "#999", fontSize: 12 }}>This is a standalone interactive CMS showcase using sample articles, not the Sanity Studio. No network writes, API tokens or production permissions are used.</p>
      </main>
    </div>
  </div>;
}
