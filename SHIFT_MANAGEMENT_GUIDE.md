# Shift Management - Admin Web Guide

## Overview
Halaman Shift Management adalah interface web admin untuk mengelola jadwal shift karyawan. Admin dapat membuat, melihat, memfilter, dan mengelola status shift dengan mudah.

## Features

### 1. **View Shifts**
- Grid layout dengan card untuk setiap shift
- Color-coded berdasarkan shift type:
  - **PAGI** (06:00-14:00): Orange
  - **SIANG** (14:00-22:00): Blue
  - **MALAM** (22:00-06:00): Purple
- Status badges:
  - **SCHEDULED**: Blue (Terjadwal)
  - **COMPLETED**: Green (Selesai)
  - **CANCELLED**: Red (Dibatalkan)

### 2. **Create Shift**
- Modal form untuk membuat shift baru
- Fields:
  - Employee selection (dropdown dari database)
  - Shift type (PAGI/SIANG/MALAM)
  - Date picker
  - Start & End time (auto-filled berdasarkan shift type)
  - Location
  - Tasks (dynamic list, bisa tambah/hapus)
  - Notes (optional)
- Auto-fill waktu berdasarkan shift type

### 3. **Filter & Search**
- **Search**: Cari berdasarkan nama employee, NIK, atau lokasi
- **Date Filter**: Filter berdasarkan tanggal tertentu
- **Shift Type Filter**: Filter PAGI/SIANG/MALAM/All
- **Status Filter**: Filter SCHEDULED/COMPLETED/CANCELLED/All

### 4. **Manage Shifts**
- **Complete**: Ubah status shift menjadi COMPLETED
- **Cancel**: Ubah status shift menjadi CANCELLED
- **Delete**: Hapus shift dari database
- Real-time update setelah action

### 5. **Responsive Design**
- Grid layout yang responsive
- Mobile-friendly
- Consistent dengan design system aplikasi

## Usage

### Accessing the Page
1. Login ke admin portal
2. Klik menu **"Shift Management"** di sidebar
3. Halaman akan menampilkan semua shift yang ada

### Creating a New Shift
1. Klik tombol **"Add Shift"** di kanan atas
2. Modal form akan muncul
3. Isi form:
   - Pilih employee dari dropdown
   - Pilih shift type (waktu akan auto-fill)
   - Pilih tanggal
   - Isi lokasi
   - Tambahkan tasks (klik "+ Add Task" untuk task tambahan)
   - Isi notes jika perlu
4. Klik **"Create Shift"**
5. Shift baru akan muncul di grid

### Filtering Shifts
1. **Search Bar**: Ketik nama employee, NIK, atau lokasi
2. **Date Picker**: Pilih tanggal untuk filter
3. **Shift Type Dropdown**: Pilih jenis shift
4. **Status Dropdown**: Pilih status shift
5. Filter akan apply secara real-time

### Managing Shift Status
1. Untuk shift dengan status SCHEDULED:
   - Klik **"Complete"** untuk mark sebagai selesai
   - Klik **"Cancel"** untuk membatalkan shift
2. Konfirmasi akan muncul
3. Status akan update secara real-time

### Deleting a Shift
1. Klik tombol **"Delete"** pada shift card
2. Konfirmasi dialog akan muncul
3. Klik OK untuk menghapus
4. Shift akan dihapus dari database

## API Integration

### Endpoints Used:
```
GET  /api/shift/all          - Fetch all shifts
GET  /api/employees          - Fetch employees for dropdown
POST /api/shift              - Create new shift
PUT  /api/shift/status       - Update shift status
DELETE /api/shift/{id}       - Delete shift
```

### Data Flow:
1. **On Page Load**:
   - Fetch all shifts
   - Fetch all employees
   - Display in grid

2. **On Create**:
   - Validate form data
   - POST to /api/shift
   - Refresh shift list

3. **On Status Update**:
   - PUT to /api/shift/status
   - Refresh shift list

4. **On Delete**:
   - DELETE to /api/shift/{id}
   - Refresh shift list

## UI Components

### Shift Card
```
┌─────────────────────────────┐
│ [PAGI] [SCHEDULED]          │
│                             │
│ John Doe                    │
│ NIK: 12345                  │
│                             │
│ 📅 2026-04-20              │
│ 🕐 06:00 - 14:00           │
│ 📍 Gedung A - Lantai 1     │
│                             │
│ Tasks:                      │
│ • Patroli area 1           │
│ • Check keamanan           │
│                             │
│ [Complete] [Cancel] [Delete]│
└─────────────────────────────┘
```

### Add Shift Modal
```
┌─────────────────────────────┐
│ Add New Shift          [X]  │
├─────────────────────────────┤
│                             │
│ Employee: [Dropdown]        │
│ Shift Type: [Dropdown]      │
│ Date: [Date Picker]         │
│ Start Time: [Time]          │
│ End Time: [Time]            │
│ Location: [Input]           │
│                             │
│ Tasks:                      │
│ [Input] [X]                 │
│ [Input] [X]                 │
│ [+ Add Task]                │
│                             │
│ Notes: [Textarea]           │
│                             │
│ [Cancel] [Create Shift]     │
└─────────────────────────────┘
```

## Color Scheme

### Shift Types:
- **PAGI**: `bg-orange-100 text-orange-800 border-orange-200`
- **SIANG**: `bg-blue-100 text-blue-800 border-blue-200`
- **MALAM**: `bg-purple-100 text-purple-800 border-purple-200`

### Status:
- **SCHEDULED**: `bg-blue-100 text-blue-800 border-blue-200`
- **COMPLETED**: `bg-green-100 text-green-800 border-green-200`
- **CANCELLED**: `bg-red-100 text-red-800 border-red-200`

## Error Handling

### Common Errors:
1. **Network Error**: Backend tidak running
   - Solution: Start backend server

2. **Employee Not Found**: NIK tidak ada di database
   - Solution: Pastikan employee sudah terdaftar

3. **Validation Error**: Form tidak lengkap
   - Solution: Isi semua field yang required (*)

4. **Database Error**: SurrealDB connection issue
   - Solution: Check SurrealDB status

### Error Display:
```
┌─────────────────────────────┐
│ ⚠️ Error message here       │
└─────────────────────────────┘
```

## Best Practices

### Creating Shifts:
1. Pastikan employee sudah terdaftar
2. Pilih tanggal yang valid (tidak di masa lalu)
3. Isi lokasi dengan jelas
4. Tambahkan tasks yang spesifik
5. Gunakan notes untuk informasi tambahan

### Managing Shifts:
1. Update status shift secara berkala
2. Hapus shift yang tidak valid
3. Gunakan filter untuk menemukan shift tertentu
4. Refresh data secara berkala

### Performance:
1. Filter data untuk mengurangi load
2. Gunakan search untuk menemukan shift spesifik
3. Refresh hanya saat diperlukan

## Troubleshooting

### Shifts Not Loading:
1. Check backend server status
2. Check browser console for errors
3. Verify API endpoint URL
4. Check network tab in DevTools

### Create Shift Failed:
1. Verify all required fields filled
2. Check employee NIK exists
3. Verify date format (YYYY-MM-DD)
4. Check backend logs

### Status Update Failed:
1. Verify shift ID is correct
2. Check backend connection
3. Verify status value is valid

## Future Enhancements

1. **Bulk Operations**:
   - Create multiple shifts at once
   - Bulk status update
   - Bulk delete

2. **Calendar View**:
   - Monthly calendar view
   - Drag & drop shift assignment

3. **Shift Templates**:
   - Save shift templates
   - Quick create from template

4. **Notifications**:
   - Email notifications for new shifts
   - Reminder notifications

5. **Reports**:
   - Shift completion reports
   - Employee shift history
   - Export to PDF/Excel

6. **Advanced Filters**:
   - Filter by employee
   - Filter by location
   - Date range filter

## Technical Details

### Framework: SolidJS
### Styling: TailwindCSS
### Icons: Lucide Solid
### State Management: Solid Signals
### Routing: @solidjs/router

### File Structure:
```
src/
├── pages/
│   └── ShiftManagement.tsx    # Main page component
├── components/
│   └── Sidebar.tsx             # Updated with Shift menu
└── index.tsx                   # Updated with route
```

## Support

For issues or questions:
1. Check backend logs
2. Check browser console
3. Verify API documentation
4. Contact development team
