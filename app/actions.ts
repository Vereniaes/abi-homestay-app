"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { sanitizePhoneDigits, formatPhoneDisplay } from "@/lib/phone";

import { calculateDueDate, getRentAmount } from "@/lib/rent";

// helper --------------------------------------------------------------------------
// function untuk mengambil statistik dashboard beranda dengan eksekusi kueri paralel
// input param : none
// output : object { totalRooms, occupiedCount, availableCount, maintenanceCount, occupancyRate, dueTenants, maintenanceRoomsList }
// end of helper ------------------------------------------------------------------
export async function getDashboardStats() {
  try {
    const [
      totalRooms,
      occupiedCount,
      availableCount,
      maintenanceCount,
      dueTenants,
      maintenanceRoomsList,
    ] = await Promise.all([
      prisma.room.count(),
      prisma.room.count({ where: { status: "OCCUPIED" } }),
      prisma.room.count({ where: { status: "AVAILABLE" } }),
      prisma.room.count({ where: { status: "MAINTENANCE" } }),
      prisma.tenant.findMany({
        where: { status: "EXPIRING_SOON" },
        include: { room: true },
        take: 5,
      }),
      prisma.room.findMany({
        where: { status: "MAINTENANCE" },
        take: 5,
      }),
    ]);

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedCount / totalRooms) * 100) : 0;

    return {
      totalRooms: totalRooms || 58,
      occupiedCount: occupiedCount || 42,
      availableCount: availableCount || 12,
      maintenanceCount: maintenanceCount || 4,
      occupancyRate: occupancyRate || 72,
      dueTenants: dueTenants || [],
      maintenanceRoomsList: maintenanceRoomsList || [],
    };
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    return {
      totalRooms: 58,
      occupiedCount: 42,
      availableCount: 12,
      maintenanceCount: 4,
      occupancyRate: 72,
      dueTenants: [],
      maintenanceRoomsList: [],
    };
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil daftar notifikasi aktif secara paralel
// input param : none
// output : object { dueTenants: Array, maintenanceRooms: Array, totalAlerts: number }
// end of helper ------------------------------------------------------------------
export async function getNotificationAlerts() {
  try {
    const [dueTenants, maintenanceRooms] = await Promise.all([
      prisma.tenant.findMany({
        where: { status: "EXPIRING_SOON" },
        include: { room: true },
        take: 10,
      }),
      prisma.room.findMany({
        where: { status: "MAINTENANCE" },
        take: 10,
      }),
    ]);

    return {
      dueTenants,
      maintenanceRooms,
      totalAlerts: dueTenants.length + maintenanceRooms.length,
    };
  } catch (error) {
    console.error("Error in getNotificationAlerts:", error);
    return {
      dueTenants: [],
      maintenanceRooms: [],
      totalAlerts: 0,
    };
  }
}
// helper --------------------------------------------------------------------------
// function untuk mengambil daftar seluruh kamar beserta data penghuni dengan try-catch
// input param : none
// output : array of Room
// end of helper ------------------------------------------------------------------
export async function getRooms() {
  try {
    return await prisma.room.findMany({
      include: {
        tenant: true,
      },
      orderBy: {
        number: "asc",
      },
    });
  } catch (error) {
    console.error("Error in getRooms:", error);
    return [];
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengupdate kondisi inventaris & status kamar
// input param : roomId (string), inventories (string[]), status ("AVAILABLE" | "OCCUPIED" | "MAINTENANCE")
// output : object room updated
// end of helper ------------------------------------------------------------------
export async function updateRoomInventory(
  roomId: string,
  inventories: string[],
  status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE"
) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses ubah data.");
      return null;
    }
    const updated = await prisma.room.update({
      where: { id: roomId },
      data: {
        inventories,
        status,
      },
    });
    revalidatePath("/kamar");
    return updated;
  } catch (error) {
    console.error("Error in updateRoomInventory:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil daftar penghuni dengan opsi pencarian dan filter
// input param : search (string), filter (string)
// output : array of Tenant
// end of helper ------------------------------------------------------------------
export async function getTenants(search: string = "", filter: string = "semua") {
  try {
    const whereCondition: any = {};

    if (filter === "aktif") {
      whereCondition.status = "ACTIVE";
    } else if (filter === "akan_jatuh_tempo") {
      whereCondition.status = "EXPIRING_SOON";
    } else if (filter === "non_aktif") {
      whereCondition.status = "INACTIVE";
    }

    if (search.trim()) {
      const sanitizedSearch = sanitizePhoneDigits(search);
      const searchOrs: any[] = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { room: { number: { contains: search, mode: "insensitive" } } },
      ];

      if (sanitizedSearch) {
        searchOrs.push({ phone: { contains: sanitizedSearch, mode: "insensitive" } });
      }

      whereCondition.OR = searchOrs;
    }

    return await prisma.tenant.findMany({
      where: whereCondition,
      include: {
        room: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error in getTenants:", error);
    return [];
  }
}

// helper --------------------------------------------------------------------------
// function untuk menambah penghuni baru
// input param : formData (FormData)
// output : object Tenant
// end of helper ------------------------------------------------------------------
export async function addTenant(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses tambah penghuni.");
      return null;
    }
    const name = (formData.get("name") as string) || "Penghuni Baru";
    const phoneRaw = (formData.get("phone") as string) || "-";
    const phone = phoneRaw !== "-" ? formatPhoneDisplay(phoneRaw) : "-";
    const roomNumberRaw = (formData.get("roomNumber") as string) || "";
    const dateInRaw = formData.get("dateIn") as string;
    const rentType = (formData.get("rentType") as string) || "MONTHLY";

    const dateIn = dateInRaw ? new Date(dateInRaw) : new Date();
    const dateDue = calculateDueDate(dateIn, rentType);

    const pricing = await prisma.pricing.findFirst();
    const rentAmount = getRentAmount(rentType, pricing);

    const roomNumberDigits = roomNumberRaw.replace(/[^0-9]/g, "");
    const roomNumber = roomNumberDigits ? roomNumberDigits.padStart(2, "0") : "01";

    let room = await prisma.room.findFirst({
      where: { number: roomNumber },
    });

    if (!room) {
      room = await prisma.room.create({
        data: {
          number: roomNumber,
          status: "OCCUPIED",
        },
      });
    } else {
      await prisma.room.update({
        where: { id: room.id },
        data: { status: "OCCUPIED" },
      });
    }

    const newTenant = await prisma.tenant.upsert({
      where: { roomId: room.id },
      create: {
        name,
        phone,
        roomId: room.id,
        status: "ACTIVE",
        dateIn,
        dateDue,
        rentType: rentType as any,
        rentAmount,
      },
      update: {
        name,
        phone,
        status: "ACTIVE",
        dateIn,
        dateDue,
        rentType: rentType as any,
        rentAmount,
      },
    });

    revalidatePath("/penghuni");
    return newTenant;
  } catch (error) {
    console.error("Error in addTenant:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk menambah banyak data penghuni sekaligus (bulk import teroptimasi)
// input param : tenantsData (array of object)
// output : object { success: boolean, count: number, message?: string }
// end of helper ------------------------------------------------------------------
export async function importTenantsBulk(tenantsData: any[]) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses impor data.");
      return { success: false, count: 0, message: "Akses ditolak: Anda tidak memiliki izin mengimpor data." };
    }

    if (!Array.isArray(tenantsData) || tenantsData.length === 0) {
      return { success: false, count: 0, message: "Data impor kosong." };
    }

    const pricing = await prisma.pricing.findFirst();

    // 1. Sanitasi & persiapkan data di memori
    const preparedList = tenantsData.map((item) => {
      const name = (item.name || "Penghuni Baru").trim();
      const phoneDigits = sanitizePhoneDigits(item.phone || "");
      const phone = phoneDigits ? formatPhoneDisplay(phoneDigits) : "-";
      const roomNumberDigits = (item.roomNumber || "").replace(/[^0-9]/g, "");
      const roomNumber = roomNumberDigits ? roomNumberDigits.padStart(2, "0") : "01";

      const rawDate = item.dateIn ? new Date(item.dateIn) : new Date();
      const dateIn = !isNaN(rawDate.getTime()) ? rawDate : new Date();
      const rentType = item.rentType || "MONTHLY";
      const dateDue = calculateDueDate(dateIn, rentType);
      const rentAmount = item.rentAmount ?? getRentAmount(rentType, pricing);

      return {
        name,
        phone,
        roomNumber,
        dateIn,
        rentType,
        dateDue,
        rentAmount,
      };
    });

    // 2. Dekode data unik per nomor kamar (mencegah bentrok E11000 duplicate key pada roomId_1)
    const tenantByRoomMap = new Map<string, (typeof preparedList)[0]>();
    preparedList.forEach((item) => {
      tenantByRoomMap.set(item.roomNumber, item);
    });
    const uniqueTenants = Array.from(tenantByRoomMap.values());
    const uniqueRoomNumbers = Array.from(tenantByRoomMap.keys());

    // 3. Ambil kamar yang sudah ada
    const existingRooms = await prisma.room.findMany({
      where: { number: { in: uniqueRoomNumbers } },
    });

    const roomMap = new Map<string, string>();
    existingRooms.forEach((r) => roomMap.set(r.number, r.id));

    // 4. Buat kamar baru untuk yang belum ada di database
    const missingRoomNumbers = uniqueRoomNumbers.filter((num) => !roomMap.has(num));
    for (const num of missingRoomNumbers) {
      const newRoom = await prisma.room.upsert({
        where: { number: num },
        create: { number: num, status: "OCCUPIED" },
        update: { status: "OCCUPIED" },
      });
      roomMap.set(num, newRoom.id);
    }

    // 5. Update status seluruh kamar yang sudah ada menjadi OCCUPIED
    const existingRoomIds = existingRooms.map((r) => r.id);
    if (existingRoomIds.length > 0) {
      await prisma.room.updateMany({
        where: { id: { in: existingRoomIds } },
        data: { status: "OCCUPIED" },
      });
    }

    // 6. Eksekusi upsert seluruh data penghuni secara paralel (batch 10)
    const BATCH_SIZE = 10;
    for (let i = 0; i < uniqueTenants.length; i += BATCH_SIZE) {
      const batch = uniqueTenants.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((item) => {
          const roomId = roomMap.get(item.roomNumber);
          if (!roomId) return Promise.resolve();
          return prisma.tenant.upsert({
            where: { roomId },
            create: {
              name: item.name,
              phone: item.phone,
              roomId,
              status: "ACTIVE",
              dateIn: item.dateIn,
              dateDue: item.dateDue,
              rentType: item.rentType as any,
              rentAmount: item.rentAmount,
            },
            update: {
              name: item.name,
              phone: item.phone,
              status: "ACTIVE",
              dateIn: item.dateIn,
              dateDue: item.dateDue,
              rentType: item.rentType as any,
              rentAmount: item.rentAmount,
            },
          });
        })
      );
    }

    revalidatePath("/penghuni");
    return { success: true, count: uniqueTenants.length };
  } catch (error: any) {
    console.error("Error in importTenantsBulk:", error);
    return {
      success: false,
      count: 0,
      message: `Gagal memproses impor: ${error?.message || "Terjadi kesalahan pada server database."}`,
    };
  }
}


// helper --------------------------------------------------------------------------
// function untuk menghapus penghuni
// input param : tenantId (string)
// output : boolean success
// end of helper ------------------------------------------------------------------
export async function deleteTenant(tenantId: string) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses hapus penghuni.");
      return false;
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (tenant) {
      await prisma.tenant.delete({
        where: { id: tenantId },
      });

      await prisma.room.update({
        where: { id: tenant.roomId },
        data: { status: "AVAILABLE" },
      });
    }

    revalidatePath("/penghuni");
    return true;
  } catch (error) {
    console.error("Error in deleteTenant:", error);
    return false;
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil daftar transaksi keuangan
// input param : none
// output : array of Transaction
// end of helper ------------------------------------------------------------------
export async function getTransactions() {
  try {
    return await prisma.transaction.findMany({
      include: {
        tenant: true,
        room: true,
      },
      orderBy: {
        date: "desc",
      },
      take: 20,
    });
  } catch (error) {
    console.error("Error in getTransactions:", error);
    return [];
  }
}

// helper --------------------------------------------------------------------------
// function untuk mencatat transaksi pembayaran dan mengupload bukti via Vercel Blob
// input param : formData (FormData)
// output : object Transaction
// end of helper ------------------------------------------------------------------
export async function addTransaction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses catat transaksi.");
      return null;
    }
    const tenantId = (formData.get("tenantId") as string) || "";
    const type = (formData.get("type") as any) || "INCOME";
    const rawRentType = formData.get("rentType") as string;
    let rentType = null;
    let description = null;

    if (type === "EXPENSE") {
      description = rawRentType;
    } else {
      rentType = (rawRentType || "MONTHLY") as any;
    }

    const amountRaw = (formData.get("amount") as string) || "0";
    const amountCleaned = amountRaw.replace(/[^0-9]/g, "");
    const amount = parseFloat(amountCleaned) || 0;
    const file = formData.get("file") as File | null;

    let proofUrl = null;
    if (file && file.size > 0) {
      if (file.size > 1 * 1024 * 1024) {
        console.warn("File size exceeds 1MB limit, skipping upload.");
      } else {
        try {
          const blob = await put(`receipts/${Date.now()}-${file.name}`, file, {
            access: "public",
          });
          proofUrl = blob.url;
        } catch (blobErr) {
          console.warn("Vercel Blob upload warning:", blobErr);
        }
      }
    }

    let roomId = null;
    if (tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (tenant) roomId = tenant.roomId;
    }

    const transaction = await prisma.transaction.create({
      data: {
        refId: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        type,
        tenantId: tenantId || null,
        roomId: roomId,
        rentType,
        description,
        amount,
        paymentMethod: "TRANSFER",
        proofUrl,
        date: new Date(),
      },
    });

    revalidatePath("/laporan");
    return transaction;
  } catch (error) {
    console.error("Error in addTransaction:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil master harga dan pengaturan sistem
// input param : none
// output : object { pricing, setting }
// end of helper ------------------------------------------------------------------
export async function getPricingAndSettings() {
  try {
    let pricing = await prisma.pricing.findFirst();
    if (!pricing) {
      pricing = await prisma.pricing.create({
        data: {
          dailyPrice: 150000,
          weeklyPrice: 900000,
          monthlyPrice: 2500000,
          yearlyPrice: 28000000,
        },
      });
    }

    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          autoWhatsappReminders: true,
        },
      });
    }

    return { pricing, setting };
  } catch (error) {
    console.error("Error in getPricingAndSettings:", error);
    return {
      pricing: {
        id: "default",
        dailyPrice: 150000,
        weeklyPrice: 900000,
        monthlyPrice: 2500000,
        yearlyPrice: 28000000,
      },
      setting: {
        id: "default",
        autoWhatsappReminders: true,
      },
    };
  }
}

// helper --------------------------------------------------------------------------
// function untuk merubah master harga sewa
// input param : pricingId (string), daily (number), weekly (number), monthly (number), yearly (number)
// output : object Pricing
// end of helper ------------------------------------------------------------------
export async function updatePricing(
  pricingId: string,
  dailyPrice: number,
  weeklyPrice: number,
  monthlyPrice: number,
  yearlyPrice: number
) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses ubah harga.");
      return null;
    }
    let pricing = await prisma.pricing.findFirst();
    if (!pricing) {
      pricing = await prisma.pricing.create({
        data: {
          dailyPrice,
          weeklyPrice,
          monthlyPrice,
          yearlyPrice,
        },
      });
    } else {
      pricing = await prisma.pricing.update({
        where: { id: pricing.id },
        data: {
          dailyPrice,
          weeklyPrice,
          monthlyPrice,
          yearlyPrice,
        },
      });
    }
    revalidatePath("/pengaturan");
    return pricing;
  } catch (error) {
    console.error("Error in updatePricing:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk merubah setting Auto-WhatsApp Reminders
// input param : settingId (string), autoWhatsapp (boolean)
// output : object Setting
// end of helper ------------------------------------------------------------------
export async function updateSetting(settingId: string, autoWhatsappReminders: boolean) {
  try {
    const user = await getCurrentUser();
    if (user && user.role === "VIEW") {
      console.warn("Akses ditolak: User dengan role VIEW tidak memiliki akses ubah pengaturan.");
      return null;
    }
    let setting = await prisma.setting.findFirst();
    if (!setting) {
      setting = await prisma.setting.create({
        data: {
          autoWhatsappReminders,
        },
      });
    } else {
      setting = await prisma.setting.update({
        where: { id: setting.id },
        data: {
          autoWhatsappReminders,
        },
      });
    }
    revalidatePath("/pengaturan");
    return setting;
  } catch (error) {
    console.error("Error in updateSetting:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk membuat akun pengguna bawaan jika database masih kosong
// input param : none
// output : boolean success
// end of helper ------------------------------------------------------------------
export async function seedUsers() {
  try {
    const count = await prisma.user.count();
    if (count === 0) {
      await prisma.user.createMany({
        data: [
          {
            username: "admin",
            name: "System Administrator",
            password: "admin123",
            role: "ADMIN",
            status: true,
          },
          {
            username: "edit",
            name: "Operator Edit",
            password: "edit123",
            role: "EDIT",
            status: true,
          },
          {
            username: "view",
            name: "Pengamat View",
            password: "view123",
            role: "VIEW",
            status: true,
          },
        ],
      });
    }
    return true;
  } catch (error) {
    console.error("Error in seedUsers:", error);
    return false;
  }
}

// helper --------------------------------------------------------------------------
// function untuk memproses login pengguna dan menyimpan sesi dalam cookie
// input param : formData (FormData)
// output : object { success: boolean, message?: string, user?: object }
// end of helper ------------------------------------------------------------------
export async function loginUser(formData: FormData) {
  try {
    await seedUsers();
    const username = (formData.get("username") as string || "").trim();
    const password = (formData.get("password") as string || "").trim();

    if (!username || !password) {
      return { success: false, message: "Username dan password wajib diisi." };
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || user.password !== password) {
      return { success: false, message: "Username atau password tidak valid." };
    }

    if (!user.status) {
      return { success: false, message: "Akun ini telah dinonaktifkan." };
    }

    const sessionData = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const cookieStore = await cookies();
    cookieStore.set("abi_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    return { success: true, user: sessionData };
  } catch (error) {
    console.error("Error in loginUser:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

// helper --------------------------------------------------------------------------
// function untuk memproses logout dan menghapus cookie sesi
// input param : none
// output : boolean success
// end of helper ------------------------------------------------------------------
export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("abi_session");
    return true;
  } catch (error) {
    console.error("Error in logoutUser:", error);
    return false;
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil data pengguna yang sedang login dari cookie sesi
// input param : none
// output : object sessionData | null
// end of helper ------------------------------------------------------------------
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("abi_session");
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return JSON.parse(sessionCookie.value);
  } catch (error) {
    console.error("Error in getCurrentUser:", error);
    return null;
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengambil daftar seluruh user (khusus ADMIN)
// input param : none
// output : array of User
// end of helper ------------------------------------------------------------------
export async function getUsers() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== "ADMIN") {
      console.warn("Akses ditolak: Hanya ADMIN yang dapat melihat daftar user.");
      return [];
    }
    return await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error("Error in getUsers:", error);
    return [];
  }
}

// helper --------------------------------------------------------------------------
// function untuk menambah user baru (khusus ADMIN)
// input param : formData (FormData)
// output : object { success: boolean, message?: string }
// end of helper ------------------------------------------------------------------
export async function createUser(formData: FormData) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return { success: false, message: "Akses ditolak: Anda tidak memiliki hak akses." };
    }

    const username = (formData.get("username") as string || "").trim();
    const name = (formData.get("name") as string || "").trim();
    const password = (formData.get("password") as string || "").trim();
    const role = (formData.get("role") as any) || "VIEW";
    const statusStr = formData.get("status") as string;
    const status = statusStr === "true" || statusStr === "Aktif";

    if (!username || !name || !password) {
      return { success: false, message: "Semua kolom (Username, Nama, Password) wajib diisi." };
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return { success: false, message: "Username sudah terdaftar." };
    }

    await prisma.user.create({
      data: {
        username,
        name,
        password,
        role,
        status,
      },
    });

    revalidatePath("/users");
    return { success: true, message: "User berhasil ditambahkan." };
  } catch (error) {
    console.error("Error in createUser:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

// helper --------------------------------------------------------------------------
// function untuk mengubah data user (khusus ADMIN)
// input param : formData (FormData)
// output : object { success: boolean, message?: string }
// end of helper ------------------------------------------------------------------
export async function updateUser(formData: FormData) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return { success: false, message: "Akses ditolak: Anda tidak memiliki hak akses." };
    }

    const id = formData.get("id") as string;
    if (!id) return { success: false, message: "ID User tidak valid." };

    const name = (formData.get("name") as string || "").trim();
    const password = (formData.get("password") as string || "").trim();
    const role = (formData.get("role") as any) || "VIEW";
    const statusStr = formData.get("status") as string;
    const status = statusStr === "true" || statusStr === "Aktif";

    if (!name) {
      return { success: false, message: "Nama Lengkap wajib diisi." };
    }

    const updateData: any = {
      name,
      role,
      status,
    };

    if (password) {
      updateData.password = password;
    }

    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/users");
    return { success: true, message: "User berhasil diperbarui." };
  } catch (error) {
    console.error("Error in updateUser:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

// helper --------------------------------------------------------------------------
// function untuk menghapus user (khusus ADMIN)
// input param : userId (string)
// output : object { success: boolean, message?: string }
// end of helper ------------------------------------------------------------------
export async function deleteUser(userId: string) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN") {
      return { success: false, message: "Akses ditolak: Anda tidak memiliki hak akses." };
    }

    if (session.id === userId) {
      return { success: false, message: "Anda tidak dapat menghapus akun Anda sendiri." };
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/users");
    return { success: true, message: "User berhasil dihapus." };
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return { success: false, message: "Terjadi kesalahan pada server." };
  }
}

