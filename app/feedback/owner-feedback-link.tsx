"use client";
import { useEffect, useState } from "react";
import "./feedback.css";

export default function OwnerFeedbackLink() {
  const [isOwner, setIsOwner] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/session", { cache: "no-store" })
      .then(response => response.ok ? response.json() : null)
      .then(session => { if (active) setIsOwner(session?.isOwner === true); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return isOwner ? <div className="owner-feedback-entry"><span>Owner tools</span><a href="/usage">Usage dashboard →</a><a href="/feedback">Nikki’s feedback inbox →</a></div> : null;
}
