// Karşılaştırma sabiti — hem sunucu (/karsilastir sayfası) hem istemci
// (useCompare hook'u) tarafından kullanılır. 'use client' modülünden sabit
// import etmek sunucuda değer yerine istemci-referansı verir; bu yüzden ayrı,
// saf bir modülde tutulur.
export const COMPARE_MAX = 4;
