"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberRole, PlanType } from "@prisma/client";

type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  // @typescript-eslint/no-explicit-any
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"Member" | "Admin">("Member");
  const [inviting, setInviting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  async function fetchMe() {
    const res = await fetch("/api/me", {
      credentials: "include",
    });
    if (!res.ok) {
      return router.push("/login");
    }
    const json = await res.json();
    setMe(json);
  }

  async function loadNotes() {
    const res = await fetch("/api/notes", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (!res.ok) {
      if (res.status === 401) {
        return router.push("/login");
      }
      alert("Failed to load notes");
      return;
    }
    const json = await res.json();
    setNotes(json);
  }

  useEffect(() => {
    fetchMe();
    loadNotes();
  }, []);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return alert("Provide email");
    setInviting(true);
    try {
      const res = await fetch(`/api/tenants/${me.tenant.slug}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Invite failed");
      } else {
        alert(`User invited. Temporary password: ${json.tempPassword}`);
        setInviteEmail("");
        setInviteRole("Member");
      }
    } catch (err) {
      console.log("ERROR: ", err);
      alert("Network error");
    } finally {
      setInviting(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title, content }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "Note limit reached") {
          alert("Note limit reached. Admin can upgrade plan.");
        } else {
          alert(json.error || "Failed to create");
        }
      } else {
        setNotes((prev) => [json, ...prev]);
        setTitle("");
        setContent("");
      }
    } catch (err) {
      console.log("ERROR: ", err);
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      setDeleting(true);
      const res = await fetch(`/api/notes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 204 || res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      } else {
        const json = await res.json().catch(() => ({}));
        alert(json.error || "Delete failed");
      }
    } catch (err) {
      console.log("ERROR: ", err);
      alert("Network error");
    } finally {
      setDeleting(false);
    }
  }

  // start editing a note
  function beginEdit(n: Note) {
    setEditingId(n.id);
    setEditTitle(n.title);
    setEditContent(n.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
  }

  // save edited note
  async function saveEdit() {
    if (!editingId) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/notes/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Update failed");
      } else {
        // update notes list
        setNotes((prev) => prev.map((n) => (n.id === json.id ? json : n)));
        cancelEdit();
      }
    } catch (err) {
      console.log("ERROR: ", err);
      alert("Network error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleUpgrade() {
    if (!me || !me.tenant) return;
    const confirmUpgrade = confirm(`Upgrade tenant ${me.tenant.slug} to Pro?`);
    if (!confirmUpgrade) return;
    const res = await fetch(`/api/tenants/${me.tenant.slug}/upgrade`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Upgrade failed");
    } else {
      alert("Upgraded to Pro. Note limit removed.");
      fetchMe();
    }
  }

  async function logout() {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    router.push("/login");
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <h1>Notes</h1>
        <div>
          {me && (
            <strong>
              {me.email} ({me.role})
            </strong>
          )}
          <button style={{ marginLeft: 8 }} onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {/* Invite UI only for Admin */}
      {me && me.role === MemberRole.ADMIN && (
        <div className="container" style={{ marginBottom: 16 }}>
          <div style={{ marginTop: 16 }}>
            <h4>Invite User</h4>
            <form onSubmit={handleInvite}>
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="email"
                style={{ padding: 8, marginRight: 8 }}
              />
              <select
                value={inviteRole}
                // @typescript-eslint/no-explicit-any
                onChange={(e) => setInviteRole(e.target.value as any)}
                style={{ padding: 8, marginRight: 8 }}
              >
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
              <button type="submit" disabled={inviting}>
                {inviting ? "Inviting..." : "Invite"}
              </button>
            </form>
            <p style={{ fontSize: 12, color: "#6b7280" }}>
              Invited users get a temporary password — admin must share it.
            </p>
          </div>
        </div>
      )}

      <div className="container" style={{ marginBottom: 16 }}>
        <form onSubmit={handleCreate}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Content"
            style={{ width: "100%", padding: 8, marginBottom: 8 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Note"}
            </button>
            {me &&
              me.role === MemberRole.ADMIN &&
              me.tenant.plan !== PlanType.PRO && (
                <button type="button" onClick={handleUpgrade}>
                  Upgrade to Pro
                </button>
              )}
          </div>
        </form>
      </div>

      <div className="container">
        <h3>Your Notes</h3>
        {notes.length === 0 && <p>No notes yet.</p>}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {notes.map((n) => (
            <li
              key={n.id}
              style={{ padding: 8, borderBottom: "1px solid #eee" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div style={{ flex: 1, marginRight: 12 }}>
                  {/* If this note is being edited, show edit inputs */}
                  {editingId === n.id ? (
                    <>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        style={{ width: "100%", padding: 8, marginBottom: 8 }}
                      />
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        style={{ width: "100%", padding: 8, marginBottom: 8 }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={saveEdit} disabled={savingEdit}>
                          {savingEdit ? "Saving..." : "Save"}
                        </button>
                        <button onClick={cancelEdit}>Cancel</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <strong>{n.title}</strong>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                      <p style={{ marginTop: 8 }}>{n.content}</p>
                    </>
                  )}
                </div>

                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {/* Show Edit +  butDeletetons when not editing; hide while editing current */}
                  {editingId !== n.id && (
                    <>
                      <button onClick={() => beginEdit(n)}>Edit</button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        disabled={deleting}
                      >
                        {deleting ? "Deleting..." : "Delete"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
