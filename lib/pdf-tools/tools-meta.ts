import { PdfToolMeta } from './types';

export const PDF_TOOLS_META: PdfToolMeta[] = [
  {
    id: 'merge',
    name: 'Gabungkan PDF',
    description: 'Gabungkan beberapa file PDF menjadi satu dokumen berurutan.',
    shortLabel: 'Merge',
    multipleFiles: true,
  },
  {
    id: 'split',
    name: 'Pisahkan PDF',
    description: 'Pisahkan PDF berdasarkan per halaman atau rentang halaman tertentu.',
    shortLabel: 'Split',
  },
  {
    id: 'compress',
    name: 'Kompres PDF',
    description: 'Kurangi ukuran file PDF dengan tetap menjaga kualitas dokumen.',
    shortLabel: 'Compress',
  },
  {
    id: 'organize',
    name: 'Atur PDF',
    description: 'Atur urutan, hapus, duplikat, dan kelola halaman PDF dengan visual drag.',
    shortLabel: 'Organize',
  },
  {
    id: 'rotate',
    name: 'Putar PDF',
    description: 'Putar orientasi halaman PDF 90°, 180°, atau 270° sesuai kebutuhan.',
    shortLabel: 'Rotate',
  },
  {
    id: 'delete-pages',
    name: 'Hapus Halaman PDF',
    description: 'Pilih dan hapus halaman yang tidak diperlukan dari dokumen PDF.',
    shortLabel: 'Delete',
  },
  {
    id: 'extract-pages',
    name: 'Ekstrak Halaman PDF',
    description: 'Ambil dan simpan halaman atau rentang tertentu menjadi dokumen baru.',
    shortLabel: 'Extract',
  },
  {
    id: 'edit',
    name: 'Edit PDF',
    description: 'Tambahkan teks, gambar, bentuk bangun, garis, dan anotasi langsung.',
    shortLabel: 'Edit',
  },
  {
    id: 'watermark',
    name: 'Tanda Air',
    description: 'Tambahkan watermark teks atau gambar logo dengan kontrol transparansi.',
    shortLabel: 'Watermark',
  },
  {
    id: 'sign',
    name: 'Tanda Tangani PDF',
    description: 'Tambahkan tanda tangan digital dengan menggambar, mengetik, atau unggah foto.',
    shortLabel: 'Sign',
  },
  {
    id: 'protect',
    name: 'Proteksi PDF',
    description: 'Kunci dan lindungi dokumen PDF menggunakan enkripsi password standar.',
    shortLabel: 'Protect',
  },
  {
    id: 'unlock',
    name: 'Buka PDF Terkunci',
    description: 'Buka dan dekripsi dokumen PDF menggunakan password yang benar.',
    shortLabel: 'Unlock',
  },
  {
    id: 'repair',
    name: 'Perbaiki PDF',
    description: 'Pulihkan struktur, cross-reference, dan konten PDF yang rusak.',
    shortLabel: 'Repair',
  },
  {
    id: 'page-numbers',
    name: 'Nomor Halaman',
    description: 'Tambahkan penomoran halaman otomatis dengan posisi dan format custom.',
    shortLabel: 'Page No',
  },
  {
    id: 'crop',
    name: 'Crop PDF',
    description: 'Potong margin atau pangkas area bidang halaman PDF secara visual.',
    shortLabel: 'Crop',
  },
  {
    id: 'compare',
    name: 'Compare PDF',
    description: 'Bandingkan dua dokumen PDF berdampingan dengan deteksi perbedaan visual.',
    shortLabel: 'Compare',
    requiresSecondFile: true,
  },
];

export function getPdfToolMeta(id: string): PdfToolMeta {
  return (
    PDF_TOOLS_META.find((t) => t.id === id) || {
      id: 'merge',
      name: 'Gabungkan PDF',
      description: 'Gabungkan beberapa file PDF menjadi satu dokumen.',
      shortLabel: 'Merge',
      multipleFiles: true,
    }
  );
}
