import { requireAdmin } from "../../lib/auth/admin";
import { signOut } from "../auth/actions";
import AdminNav from "./admin-nav";
export const dynamic="force-dynamic";
export default async function Layout({children}) {
  const user=await requireAdmin();
  return <div className="admin-page">
    <a href="#admin-content" className="skip-link">Skip to page content</a>
    <header className="page-header"><div><h1>Punchline Admin</h1><p className="muted">Signed in as {user.email || "administrator"}</p></div>
      <form action={signOut}><button>Sign out</button></form></header>
    <div className="admin-workspace"><AdminNav /><main id="admin-content" className="admin-content" tabIndex={-1}>{children}</main></div>
  </div>;
}
