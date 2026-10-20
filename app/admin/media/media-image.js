"use client";
import { useState } from "react";
export default function MediaImage({id,alt="",thumbnail=false}) {
  const [failed,setFailed]=useState(false);
  if(failed) return <span className="unpublished-thumbnail">Preview unavailable</span>;
  return <img src={`/api/admin/media/${id}`} alt={alt} className={thumbnail?"post-thumbnail":"media-preview"}
    width={thumbnail?88:undefined} height={thumbnail?72:undefined} loading={thumbnail?"lazy":"eager"} onError={()=>setFailed(true)}/>;
}
