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
      <div className="hidden lg:block lg:w-3/5 relative">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-cover"
          priority
        />
        <div className={`absolute inset-0 ${gradientClass}`} />
      </div>

      <div className="w-full lg:w-2/5 flex items-center justify-center bg-white px-10">
        <div className="w-full">{children}</div>
      </div>
    </div>
  );
}
