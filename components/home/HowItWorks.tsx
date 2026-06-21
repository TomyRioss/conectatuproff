const STEPS = [
  {
    number: "01",
    title: "Elegí al profesional",
    description:
      "Buscá por servicio, barrio y disponibilidad. Leé reseñas de otros clientes y elegí el que mejor se adapte a vos.",
    color: "#1EC97E",
  },
  {
    number: "02",
    title: "Coordiná el servicio",
    description:
      "Solicitá un turno o hacé una consulta directamente desde el perfil. Recibís confirmación por email al instante.",
    color: "#6C5CE7",
  },
  {
    number: "03",
    title: "Servicio completado",
    description:
      "El profesional se presenta, hace su trabajo y vos dejás una reseña para ayudar a la comunidad.",
    color: "#1A1A2E",
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 px-4 bg-[#F3F4F8]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-[#6B7280] text-sm font-medium uppercase tracking-wider mb-2">
            Simple y rápido
          </p>
          <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[#1A1A2E]">
            ¿Cómo funciona?
          </h2>
          <p className="text-[#6B7280] mt-4 max-w-lg mx-auto">
            Conectamos clientes con profesionales en tres pasos simples.
            Sin complicaciones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}

type Step = (typeof STEPS)[0]

function StepCard({ step }: { step: Step }) {
  return (
    <div className="bg-white rounded-2xl p-7 border border-gray-200 relative overflow-hidden">
      {/* Large number background */}
      <span
        className="absolute top-3 right-4 font-[family-name:var(--font-display)] text-7xl font-bold opacity-[0.07] select-none leading-none"
        style={{ color: step.color }}
      >
        {step.number}
      </span>

      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold mb-5"
        style={{ backgroundColor: step.color }}
      >
        {step.number}
      </div>

      <h3 className="font-semibold text-[#1A1A2E] text-lg mb-3">
        {step.title}
      </h3>
      <p className="text-[#6B7280] text-sm leading-relaxed">
        {step.description}
      </p>
    </div>
  )
}
