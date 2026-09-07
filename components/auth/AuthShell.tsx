import Image from "next/image";
import Link from "next/link";

interface AuthShellProps {
  children: React.ReactNode;
  imageSrc: string;
  imageAlt: string;
  gradientClass: string;
  headerAction?: React.ReactNode;
}

export default function AuthShell({ children, imageSrc, imageAlt, gradientClass, headerAction }: AuthShellProps) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      <div className="w-full lg:w-1/2 flex flex-1 lg:flex-none flex-col bg-white px-5 py-5 sm:px-8 sm:py-6 lg:px-10 lg:py-8 order-2 lg:order-1">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <Link href="/" className="text-lg sm:text-xl font-bold text-brand-dark font-display shrink-0">
            Conecta<span className="text-brand-violet">Tu</span>Proff
          </Link>
          {headerAction ? (
            <div className="text-[13px] sm:text-sm text-brand-gray text-right leading-snug">{headerAction}</div>
          ) : null}
        </div>
        <div className="flex-1 flex items-start sm:items-center justify-center pt-6 pb-10 sm:py-8 lg:py-0">
          <div className="w-full max-w-md">{children}</div>
        </div>
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
