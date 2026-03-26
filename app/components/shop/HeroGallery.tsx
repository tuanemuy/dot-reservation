type HeroGalleryProps = {
  imageUrls: string[];
  shopName: string;
};

export function HeroGallery({ imageUrls, shopName }: HeroGalleryProps) {
  const hasMainImage = imageUrls.length > 0;

  return (
    <div className="grid grid-cols-2 gap-2 overflow-hidden rounded-xl [grid-template-rows:240px_140px]">
      <div
        className={`relative col-span-full flex items-end p-6 ${!hasMainImage ? "bg-gradient-to-br from-primary-lighter to-primary-light" : ""}`}
      >
        {imageUrls[0] ? (
          <img
            src={imageUrls[0]}
            alt={`${shopName} メイン`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-base font-medium uppercase tracking-[0.1em] text-primary opacity-40">
            Photo
          </span>
        )}
        {imageUrls.length > 1 && (
          <span className="relative z-10 rounded-sm bg-black/50 px-4 py-1 text-xs font-medium text-white backdrop-blur-[4px]">
            1 / {imageUrls.length}
          </span>
        )}
      </div>
      <GallerySubImage src={imageUrls[1]} alt={`${shopName} 2`} />
      <GallerySubImage src={imageUrls[2]} alt={`${shopName} 3`} />
    </div>
  );
}

function GallerySubImage({
  src,
  alt,
}: {
  src: string | undefined;
  alt: string;
}) {
  return (
    <div className="relative flex items-center justify-center bg-neutral-200">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-medium uppercase tracking-[0.08em] text-neutral-500">
          Photo
        </span>
      )}
    </div>
  );
}
