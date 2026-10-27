"use client";
import { usePathname } from "next/navigation";
import {useState} from 'react';
import {navigationGroups,isActiveRoute} from '../../lib/admin-navigation.mjs';
export default function AdminNav() {
  const path=usePathname();
  const [open,setOpen]=useState(false);
  const current=navigationGroups.flatMap(g=>g.items).find(([href])=>isActiveRoute(path,href));
  return <aside className="admin-sidebar">
    <noscript><style>{'.task-navigation { display: block !important; } .navigation-toggle { display: none !important; }'}</style></noscript>
    <button className="navigation-toggle" aria-expanded={open} aria-controls="task-navigation" onClick={()=>setOpen(!open)}>Menu <span>{current?.[1]??'Administration'}</span></button>
    <nav id="task-navigation" aria-label="Administration" className="task-navigation" data-open={open}>{navigationGroups.map(group=><div className="nav-group" key={group.label}><p>{group.label}</p>
      {group.items.map(([href,label])=><a key={href} href={href} aria-current={isActiveRoute(path,href)?'page':undefined}>{label}</a>)}
    </div>)}</nav>
  </aside>;
}
