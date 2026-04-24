# CHANGELOG - Smart Attendance Frontend

Dokumen ini mencatat perubahan besar dan fitur baru yang telah diimplementasikan dalam pengembangan sistem Smart Attendance Admin.

## [2026-04-21] - Patrol Management & Shift Grouping

### 🆕 Fitur Baru
- **Manajemen Checkpoint (Patrol)**:
    - Implementasi interface CRUD (Create, Read, Update, Delete) untuk titik checkpoint patroli.
    - Penambahan field Geo-tagging (Latitude & Longitude) pada setiap checkpoint.
- **Dashboard Tracking Patroli**:
    - Tampilan peta interaktif (placeholder) untuk monitoring petugas.
    - Log aktivitas real-time untuk memantau scan QR petugas di lapangan.
- **Manajemen Grup (Shift Management)**:
    - Penambahan tab baru "Manajemen Grup" di halaman Shift Management.
    - Interface untuk membuat dan mengelola grup karyawan.
    - **Member Selection**: Fitur pencarian dan pemilihan multi-karyawan untuk dimasukkan ke dalam grup.
- **Sistem Navigasi Tab**: Refactor halaman Shift Management menggunakan sistem tab (Jadwal Shift vs Manajemen Grup).

### 🛠 Dasar Arsitektur (Reusable Components)
Telah dibangun pustaka komponen UI internal untuk menjaga konsistensi desain:
- `src/components/ui/Modal.tsx`: Dialog dengan animasi premium.
- `src/components/ui/Button.tsx`: Tombol dengan berbagai varian status (loading, ghost, primary, dll).
- `src/components/ui/Input.tsx`: Komponen input standar dengan manajemen label.
- `src/components/GroupList.tsx`: Komponen daftar grup berbasis kartu (Card-based).
- `src/components/GroupForm.tsx`: Komponen form grup dengan seleksi anggota.

### 🎨 Desain & UX
- Menggunakan palet warna HSL modern untuk nuansa premium.
- Implementasi animasi halus (transitions & hover effects) pada setiap elemen interaktif.
- Layout yang responsif untuk berbagai ukuran layar.

### 🔗 Integrasi Backend
- Koneksi ke API `/api/shift` untuk jadwal.
- Koneksi ke API `/api/groups` (assumed) untuk manajemen grup.
- Fallback mockup data diimplementasikan untuk memastikan UI tetap bisa didemokan meskipun backend sedang dikembangkan.

---
*Dibuat oleh: Antigravity AI Coding Assistant*
