import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Yalnızca taradığımız 5 perakendecinin görsel CDN'leri. Alan başına joker
    // (**) alt alan adı kayması için (ör. n11scdn / n11scdn3). Yeni bir site
    // eklenirse buraya da hostu eklenmeli (yoksa <Image> o hostta hata verir);
    // ProductImage yüklenemeyen görselde placeholder'a düşerek bunu yumuşatır.
    remotePatterns: [
      { protocol: "https", hostname: "**.dsmcdn.com" }, // Trendyol
      { protocol: "https", hostname: "**.akamaized.net" }, // N11
      { protocol: "https", hostname: "**.hepsiburada.net" }, // Hepsiburada
      { protocol: "https", hostname: "**.media-amazon.com" }, // Amazon
      { protocol: "https", hostname: "**.ssl-images-amazon.com" }, // Amazon
      { protocol: "https", hostname: "**.vatanbilgisayar.com" }, // Vatan
    ],
  },
};

export default nextConfig;
