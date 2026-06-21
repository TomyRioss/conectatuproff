const PARTIDOS = [
  "La Plata",
  "Quilmes",
  "Lanús",
  "Lomas de Zamora",
  "San Isidro",
  "Tigre",
  "Morón",
  "Tres de Febrero",
  "San Martín",
  "Merlo",
  "Moreno",
  "Florencio Varela",
  "Berazategui",
  "Avellaneda",
  "Vicente López",
]

export default function CitiesSection() {
  return (
    <section className="py-16 px-4 bg-[#F2EDE8]">
      <div className="max-w-6xl mx-auto">
        <h2 className="font-[family-name:var(--font-display)] text-3xl sm:text-4xl font-bold text-[#3D322E] mb-10">
          Encontrá profesionales en tu ciudad
        </h2>

        <div className="p-0">
          <p className="font-bold text-[#3D322E] text-lg mb-4">Buenos Aires</p>
          <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {PARTIDOS.map((p) => (
              <li key={p} className="text-[#847071] text-sm">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
