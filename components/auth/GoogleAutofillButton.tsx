"use client";

import Script from "next/script";
import { useId, useRef } from "react";
import { toast } from "sonner";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (res: { credential: string }) => void }) => void;
          renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function decodeGoogleCredential(credential: string) {
  const payload = credential.split(".")[1];
  const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  return { firstName: json.given_name as string, lastName: json.family_name as string, email: json.email as string };
}

export default function GoogleAutofillButton({
  onFill,
}: {
  onFill: (data: { firstName: string; lastName: string; email: string }) => void;
}) {
  const containerId = `gsi-btn-${useId().replace(/:/g, "")}`;
  const initialized = useRef(false);

  function init() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google || initialized.current) return;
    initialized.current = true;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (res) => {
        try {
          onFill(decodeGoogleCredential(res.credential));
          toast.success("Datos completados desde Google");
        } catch {
          toast.error("No se pudo leer tu cuenta de Google");
        }
      },
    });
    const el = document.getElementById(containerId);
    if (el) window.google.accounts.id.renderButton(el, { theme: "outline", size: "large", width: 320, text: "signup_with" });
  }

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={init} onReady={init} />
      <div id={containerId} className="flex justify-center" />
    </>
  );
}
