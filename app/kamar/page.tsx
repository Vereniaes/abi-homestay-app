"use client";

// app/kamar/page.tsx
// -> handling manajemen kamar dan inventaris
//      -> menampilkan grid daftar kamar (tersedia, terisi, perbaikan)
//      -> menangani pencarian nomor kamar
//      -> menangani direct link auto-open modal detail kamar dari parameter URL ?room=XX
// -> kelola status inventaris (baik / perbaikan) dan pembaruan database Prisma

import { useEffect, useState, useTransition, useMemo, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { getRooms, updateRoomInventory, getCurrentUser } from "../actions";
import { getClientCache, setClientCache, isCacheStale } from "@/lib/client-cache";

interface Tenant {
  id: string;
  name: string;
  phone: string;
  dateIn: Date;
  dateDue: Date | null;
}

interface Room {
  id: string;
  number: string;
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE";
  inventories: any;
  tenant?: Tenant | null;
}

const INVENTORY_ITEMS = [
  { name: "AC Panasonic 1/2 PK", icon: "ac_unit" },
  { name: "TV LED 32\"", icon: "tv" },
  { name: "Kasur Springbed", icon: "bed" },
  { name: "Kunci Pintu Pintar", icon: "door_front" },
  { name: "Tembok Kamar", icon: "format_paint" },
];

// helper --------------------------------------------------------------------------
// function Komponen Utama Manajemen Kamar dengan SWR Client Caching
// input param : none
// output : React Client Component JSX untuk grid kamar & modal detail
// end of helper ------------------------------------------------------------------
function KamarContent() {
  const searchParams = useSearchParams();
  const roomQuery = searchParams ? searchParams.get("room") : null;

  const [rooms, setRooms] = useState<Room[]>(() => getClientCache<Room[]>("rooms") || []);
  const [currentUser, setCurrentUser] = useState<{ role: string; name?: string } | null>(() => getClientCache("currentUser"));
  const isViewOnly = currentUser?.role === "VIEW";
  const [search, setSearch] = useState("");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [inventoryStates, setInventoryStates] = useState<string[]>(["baik", "baik", "baik", "baik", "baik"]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!currentUser) {
      getCurrentUser().then((u) => {
        if (u) {
          setCurrentUser(u);
          setClientCache("currentUser", u);
        }
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const cached = getClientCache<Room[]>("rooms");
    if (cached && cached.length > 0) {
      setRooms(cached);
      // Revalidasi senyap di latar belakang hanya jika cache basi (> 45 detik)
      if (!isCacheStale("rooms", 45000)) return;
    }
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const data = await getRooms();
    if (Array.isArray(data)) {
      setRooms(data as Room[]);
      setClientCache("rooms", data);
    }
  };

  // helper --------------------------------------------------------------------------
  // function untuk membuka modal detail kamar dan deteksi parameter URL ?room=XX
  // input param : rooms (array), roomQuery (string)
  // output : void (membuka modal detail kamar otomatis jika parameter cocok)
  // end of helper ------------------------------------------------------------------
  useEffect(() => {
    if (rooms.length > 0 && roomQuery) {
      const queryDigits = roomQuery.replace(/[^0-9]/g, "");
      const targetRoom = rooms.find((r) => {
        const roomDigits = r.number.replace(/[^0-9]/g, "");
        return (
          r.number === roomQuery ||
          r.number.toLowerCase() === roomQuery.toLowerCase() ||
          r.id === roomQuery ||
          (queryDigits && roomDigits && parseInt(queryDigits, 10) === parseInt(roomDigits, 10))
        );
      });
      if (targetRoom) {
        openModal(targetRoom);
      }
    }
  }, [rooms, roomQuery]);

  const openModal = (room: Room) => {
    setSelectedRoom(room);
    if (Array.isArray(room.inventories)) {
      setInventoryStates(room.inventories);
    } else {
      setInventoryStates(["baik", "baik", "baik", "baik", "baik"]);
    }
  };

  const closeModal = () => {
    setSelectedRoom(null);
    if (typeof window !== "undefined" && window.history) {
      window.history.replaceState({}, "", "/kamar");
    }
  };

  const handleToggleInventory = (index: number, state: string) => {
    const newStates = [...inventoryStates];
    newStates[index] = state;
    setInventoryStates(newStates);
  };

  const handleSaveChanges = () => {
    if (!selectedRoom) return;

    const hasDamage = inventoryStates.some((s) => s === "perbaikan");
    let newStatus: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" = selectedRoom.status;

    if (hasDamage) {
      newStatus = "MAINTENANCE";
    } else if (selectedRoom.status === "MAINTENANCE") {
      newStatus = selectedRoom.tenant ? "OCCUPIED" : "AVAILABLE";
    }

    startTransition(async () => {
      const result = await updateRoomInventory(selectedRoom.id, inventoryStates, newStatus);
      if (result) {
        // Optimistic cache mutation - update UI langsung tanpa tunggu refetch
        const updatedRooms = rooms.map((r) =>
          r.id === selectedRoom.id
            ? { ...r, inventories: inventoryStates, status: newStatus }
            : r
        );
        setRooms(updatedRooms);
        setClientCache("rooms", updatedRooms);
      }
      closeModal();
      // Background refetch untuk sinkronisasi data terbaru
      fetchRooms();
    });
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) =>
      r.number.toLowerCase().includes(search.toLowerCase())
    );
  }, [rooms, search]);

  return (
    <main className="flex-1 w-full max-w-container-max mx-auto px-4 md:px-6 pt-28 md:pt-8 pb-28 md:pb-12 flex flex-col min-h-screen">
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-end mb-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Manajemen Kamar
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Pengelolaan Status &amp; Inventaris Kamar
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex gap-sm mb-md shrink-0">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#F1F5F9] border border-outline-variant/30 rounded-xl py-3 pl-10 pr-4 font-body-md text-body-md text-on-surface focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors placeholder:font-body-md placeholder:text-on-surface-variant/60"
            placeholder="Cari No. Kamar..."
            type="text"
          />
        </div>
        <button className="shrink-0 w-12 h-12 bg-white rounded-xl border border-outline-variant/30 flex items-center justify-center text-primary shadow-sm hover:shadow-md transition-shadow press-effect">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </div>

      {/* Room Grid */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-sm md:gap-4">
          {rooms.length === 0 && !search
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={`skel-${i}`} className="aspect-square rounded-2xl skeleton-shimmer" />
              ))
            : filteredRooms.map((room, idx) => {
            let stateClass = "state-available";
            let iconBg = "bg-[#0D9488]/10 text-[#0D9488]";
            let iconName = "check_circle";

            if (room.status === "MAINTENANCE") {
              stateClass = "state-maintenance";
              iconBg = "bg-[#F59E0B]/10 text-[#D97706]";
              iconName = "build";
            }

            const isAboveFold = idx < 12;
            const animClass = isAboveFold ? "room-card" : "room-card-instant";
            const delay = isAboveFold ? `${(idx * 0.02).toFixed(2)}s` : "0s";

            return (
              <div
                key={room.id}
                onClick={() => openModal(room)}
                className={`lazy-card ${animClass} ${stateClass} rounded-2xl p-3 flex flex-col items-center justify-center aspect-square press-effect cursor-pointer gpu-accelerate`}
                style={{ animationDelay: delay }}
              >
                <span className="font-headline-lg text-headline-lg font-bold text-primary mb-2">
                  {room.number}
                </span>

                <div className={`w-8 h-8 rounded-full ${iconBg} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {iconName}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Popup: Kamar Detail */}
      {selectedRoom && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={closeModal}
          ></div>

          <div className="relative w-full md:w-[500px] bg-surface rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[85vh] flex flex-col z-10 animate-slide-up overflow-hidden pb-safe">
            <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto mt-3 mb-2 shrink-0 md:hidden"></div>

            <div className="px-md py-4 flex justify-between items-center border-b border-surface-variant shrink-0">
              <div>
                <h2 className="font-headline-md text-headline-md text-primary">
                  Kamar {selectedRoom.number}
                </h2>
                <span
                  className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-1 ${
                    selectedRoom.status === "OCCUPIED"
                      ? "bg-surface-container text-primary-container"
                      : selectedRoom.status === "AVAILABLE"
                      ? "bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
                      : "bg-[#F59E0B]/10 text-[#D97706] border border-[#F59E0B]/20"
                  }`}
                >
                  {selectedRoom.status === "OCCUPIED"
                    ? "Terisi"
                    : selectedRoom.status === "AVAILABLE"
                    ? "Tersedia"
                    : "Perbaikan"}
                </span>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-variant/50 hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-md overflow-y-auto no-scrollbar flex-1 space-y-6">
              {/* Tenant Info (Conditional) */}
              {selectedRoom.tenant && (
                <div>
                  <h3 className="font-label-md text-label-md text-on-surface-variant mb-3">
                    Informasi Penghuni
                  </h3>
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-outline-variant/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-headline-md">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                    <div>
                      <p className="font-body-md text-body-md text-primary font-semibold">
                        {selectedRoom.tenant.name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                        {selectedRoom.tenant.phone}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Inventory & Condition */}
              <div>
                <h3 className="font-label-md text-label-md text-on-surface-variant mb-3">
                  Inventaris &amp; Kondisi
                </h3>
                <div className="bg-white rounded-xl border border-outline-variant/20 shadow-sm overflow-hidden divide-y divide-surface-variant/50">
                  {INVENTORY_ITEMS.map((item, idx) => {
                    const state = inventoryStates[idx] || "baik";
                    return (
                      <div key={item.name} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 text-primary">
                          <span className="material-symbols-outlined text-outline">
                            {item.icon}
                          </span>
                          <span className="font-body-md text-body-md">{item.name}</span>
                        </div>
                        {isViewOnly ? (
                          <span
                            className={`px-3 py-1 rounded-md text-xs font-semibold ${
                              state === "baik"
                                ? "bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20"
                                : "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/30"
                            }`}
                          >
                            {state === "baik" ? "Baik" : "Perbaikan"}
                          </span>
                        ) : (
                          <div className="flex bg-surface-container-low rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => handleToggleInventory(idx, "baik")}
                              className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                                state === "baik"
                                  ? "font-semibold bg-white shadow-sm text-secondary"
                                  : "font-medium text-on-surface-variant"
                              }`}
                            >
                              Baik
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleInventory(idx, "perbaikan")}
                              className={`px-3 py-1 rounded-md text-xs transition-all duration-200 ${
                                state === "perbaikan"
                                  ? "font-semibold bg-[#FEF3C7] text-[#92400E] shadow-sm"
                                  : "font-medium text-on-surface-variant"
                              }`}
                            >
                              Perbaikan
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {!isViewOnly && (
              <div className="p-md pt-2 shrink-0 border-t border-surface-variant bg-surface">
                <button
                  onClick={handleSaveChanges}
                  disabled={isPending}
                  className="w-full bg-secondary text-white font-label-md text-label-md py-3.5 rounded-xl hover:bg-on-secondary-container transition-colors shadow-[0_0_15px_rgba(13,148,136,0.15)] flex items-center justify-center gap-2"
                >
                  {isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// helper --------------------------------------------------------------------------
// function Wrapper Suspense Halaman Manajemen Kamar
// input param : none
// output : React Component Halaman Kamar terbungkus Suspense
// end of helper ------------------------------------------------------------------
export default function KamarPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-outline">Memuat data kamar...</div>}>
      <KamarContent />
    </Suspense>
  );
}
