export function StickyBookingCTA() {
  return (
    <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
      <div className="max-w-2xl mx-auto">
        <p className="text-center text-sm text-brand-dark font-medium">¿Lista para tu turno?</p>
        <p className="text-center text-xs text-brand-gray mb-2">Reservá online en 1 minuto.</p>
        <button
          type="button"
          className="w-full bg-brand-green text-white font-semibold rounded-full py-3 hover:opacity-90 transition-opacity"
        >
          Reservar turno
        </button>
      </div>
    </div>
  );
}
