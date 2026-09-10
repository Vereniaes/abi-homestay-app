"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { getUsers, createUser, updateUser, deleteUser, getCurrentUser } from "../actions";

interface User {
  id: string;
  username: string;
  name: string;
  role: "ADMIN" | "EDIT" | "VIEW";
  status: boolean;
  createdAt: Date;
}

// helper --------------------------------------------------------------------------
// function Halaman Manajemen User (Khusus ADMIN)
// input param : none
// output : React Client Component JSX
// end of helper ------------------------------------------------------------------
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form states
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"ADMIN" | "EDIT" | "VIEW">("VIEW");
  const [status, setStatus] = useState("Aktif");

  // Current session
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetchUsers();
    getCurrentUser().then(user => setCurrentUser(user));
  }, []);

  const fetchUsers = async () => {
    const data = await getUsers();
    setUsers(data as unknown as User[]);
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername("");
    setName("");
    setPassword("");
    setRole("VIEW");
    setStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setName(user.name);
    setPassword(""); // Password kosong saat edit (opsional)
    setRole(user.role);
    setStatus(user.status ? "Aktif" : "Nonaktif");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("username", username);
    formData.append("name", name);
    formData.append("password", password);
    formData.append("role", role);
    formData.append("status", status);
    
    if (editingUser) {
      formData.append("id", editingUser.id);
      startTransition(async () => {
        const res = await updateUser(formData);
        if (res.success) {
          setIsModalOpen(false);
          await fetchUsers();
        } else {
          alert(res.message);
        }
      });
    } else {
      startTransition(async () => {
        const res = await createUser(formData);
        if (res.success) {
          setIsModalOpen(false);
          await fetchUsers();
        } else {
          alert(res.message);
        }
      });
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini?")) {
      startTransition(async () => {
        const res = await deleteUser(userId);
        if (res.success) {
          await fetchUsers();
        } else {
          alert(res.message);
        }
      });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => 
      u.name.toLowerCase().includes(search.toLowerCase()) || 
      u.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  // helper --------------------------------------------------------------------------
  // function untuk mendapatkan style badge warna berdasarkan role pengguna
  // input param : role (string)
  // output : string (kelas css tailwind untuk background, text, & border)
  // end of helper ------------------------------------------------------------------
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-[#0F172A] text-[#FCD34D] border-amber-400/40";
      case "EDIT":
        return "bg-secondary-container/40 text-secondary border-secondary/30";
      default:
        return "bg-surface-container-high text-outline border-outline-variant/40";
    }
  };

  return (
    <main className="pt-28 md:pt-8 px-4 md:px-6 max-w-container-max mx-auto pb-28 md:pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 pt-2 gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Manajemen User
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Kelola akses pengguna aplikasi
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="py-2.5 px-5 bg-brand-teal text-white rounded-xl shadow-md hover:bg-brand-deep-blue transition-colors flex items-center gap-2 font-semibold text-label-md w-full md:w-auto justify-center"
        >
          <span className="material-symbols-outlined text-lg">person_add</span>
          Tambah User
        </button>
      </div>

      {/* Search */}
      <div className="mb-md animate-slide-up stagger-1">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-secondary transition-colors">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-surface-container-low border border-surface-variant text-body-md font-body-md focus:border-secondary focus:ring-1 focus:ring-secondary outline-none transition-all placeholder:text-outline"
            placeholder="Cari nama atau username..."
            type="text"
          />
        </div>
      </div>

      {/* Desktop Table & Mobile Cards */}
      <div className="animate-slide-up stagger-2">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-2xl border border-surface-variant bg-surface-container-low shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-variant/30 border-b border-surface-variant">
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">No</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Role Access</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 font-label-md text-label-md text-on-surface-variant uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-variant">
              {filteredUsers.map((user, idx) => (
                <tr key={user.id} className="hover:bg-surface-variant/20 transition-colors">
                  <td className="px-6 py-4 text-body-md text-on-surface">{idx + 1}</td>
                  <td className="px-6 py-4 text-body-md font-medium text-primary">{user.username}</td>
                  <td className="px-6 py-4 text-body-md text-on-surface">{user.name}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-md border ${getRoleBadgeStyle(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-label-sm font-semibold px-3 py-1 rounded-full ${user.status ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-error-container/50 text-error'}`}>
                      {user.status ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleOpenEdit(user)} className="p-2 rounded-lg bg-secondary-container/40 text-secondary hover:bg-secondary-container transition-colors" title="Edit">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDelete(user.id)} disabled={currentUser?.id === user.id} className="p-2 rounded-lg bg-error-container/40 text-error hover:bg-error-container disabled:opacity-50 transition-colors" title="Hapus">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    Tidak ada data pengguna.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-4 rounded-2xl bg-surface-container-low border border-surface-variant shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-headline-md text-body-lg text-primary">{user.name}</h3>
                  <p className="font-body-md text-label-sm text-outline">@{user.username}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${getRoleBadgeStyle(user.role)}`}>
                  {user.role}
                </span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-surface-variant/50">
                <span className={`text-label-sm font-semibold px-2.5 py-0.5 rounded-full ${user.status ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-error-container/50 text-error'}`}>
                  {user.status ? 'Aktif' : 'Nonaktif'}
                </span>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleOpenEdit(user)} className="px-3 py-1.5 rounded-lg bg-secondary-container/40 text-secondary font-label-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">edit</span> Edit
                  </button>
                  <button onClick={() => handleDelete(user.id)} disabled={currentUser?.id === user.id} className="px-3 py-1.5 rounded-lg bg-error-container/40 text-error font-label-sm flex items-center gap-1 disabled:opacity-50">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="p-8 text-center text-on-surface-variant border border-surface-variant rounded-2xl border-dashed">
              Tidak ada data pengguna.
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/50 transition-opacity"
          ></div>
          <div className="relative w-full md:w-[500px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto hide-scrollbar pb-safe z-10 animate-slide-up">
            <div
              className="w-full flex justify-center pt-4 pb-2 cursor-pointer"
              onClick={() => setIsModalOpen(false)}
            >
              <div className="w-12 h-1.5 bg-outline-variant rounded-full"></div>
            </div>

            <div className="px-6 pb-8 pt-2">
              <h3 className="font-headline-md text-headline-md text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined">{editingUser ? 'manage_accounts' : 'person_add'}</span>
                {editingUser ? "Edit User" : "Tambah User Baru"}
              </h3>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Username</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md disabled:opacity-60"
                    placeholder="Username untuk login"
                  />
                  {editingUser && <span className="text-[10px] text-error mt-1 block">Username tidak dapat diubah</span>}
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">Nama Lengkap</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md"
                    placeholder="Nama Lengkap"
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1 block">
                    Password {editingUser && "(Opsional)"}
                  </label>
                  <input
                    type={editingUser ? "password" : "text"}
                    required={!editingUser}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-surface-container-low border border-surface-variant focus:border-secondary focus:ring-1 focus:ring-secondary outline-none text-body-md"
                    placeholder={editingUser ? "Kosongkan jika tidak ingin diubah" : "Password baru"}
                  />
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1.5 block">Role Access</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { key: "VIEW", label: "VIEW" },
                      { key: "EDIT", label: "EDIT" },
                      { key: "ADMIN", label: "ADMIN" },
                    ].map((item) => {
                      const isSelected = role === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setRole(item.key as any)}
                          className={`py-2 px-2 rounded-xl font-label-sm text-label-sm border transition-all ${
                            isSelected
                              ? "border-secondary bg-secondary/10 text-secondary font-bold shadow-sm"
                              : "border-surface-variant bg-surface-container-low text-on-surface-variant hover:bg-surface-variant"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-label-sm text-on-surface-variant mb-1.5 block">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${status === "Aktif" ? "border-[#25D366] bg-[#25D366]" : "border-outline group-hover:border-primary"}`}>
                        {status === "Aktif" && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                      </div>
                      <span className="text-body-md text-on-surface">Aktif</span>
                      <input type="radio" name="status" value="Aktif" className="hidden" checked={status === "Aktif"} onChange={() => setStatus("Aktif")} />
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${status === "Nonaktif" ? "border-error bg-error" : "border-outline group-hover:border-primary"}`}>
                        {status === "Nonaktif" && <span className="material-symbols-outlined text-white text-[12px] font-bold">check</span>}
                      </div>
                      <span className="text-body-md text-on-surface">Nonaktif</span>
                      <input type="radio" name="status" value="Nonaktif" className="hidden" checked={status === "Nonaktif"} onChange={() => setStatus("Nonaktif")} />
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 rounded-xl bg-surface-container text-on-surface-variant font-label-md font-semibold hover:bg-surface-variant transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 py-4 rounded-xl bg-brand-teal text-white font-label-md font-bold shadow-md hover:bg-brand-deep-blue transition-colors flex justify-center items-center gap-2"
                  >
                    {isPending ? (
                      "Menyimpan..."
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
