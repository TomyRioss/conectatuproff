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
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="w-full lg:w-1/2 flex flex-col bg-white px-10 py-8 order-2 lg:order-1">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold text-brand-dark font-display shrink-0">
            Conecta<span className="text-brand-violet">Tu</span>Proff
          </Link>
          {headerAction ? (
            <div className="text-sm text-brand-gray text-right">{headerAction}</div>
          ) : null}
        </div>
        <div className="flex-1 flex items-center justify-center">
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
