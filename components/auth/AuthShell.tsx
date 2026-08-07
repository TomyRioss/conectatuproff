import Image from "next/image";

interface AuthShellProps {
  children: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  gradientClass: string;
}

export default function AuthShell({ children, imageSrc, imageAlt, gradientClass }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-10 order-2 lg:order-1">
        <div className="w-full max-w-md">{children}</div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative order-1 lg:order-2">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
        />
        <div className={`absolute inset-0 ${gradientClass}`} />
      </div>
    </div>
  );
}
