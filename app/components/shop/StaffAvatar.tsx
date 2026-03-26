type StaffAvatarProps = {
  displayName: string;
  imageUrl: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-lg",
  lg: "h-14 w-14 text-xl",
} as const;

export function StaffAvatar({
  displayName,
  imageUrl,
  size = "md",
}: StaffAvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-secondary-lighter to-secondary-light font-medium text-secondary ${sizeClasses[size]}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        displayName.charAt(0)
      )}
    </div>
  );
}
