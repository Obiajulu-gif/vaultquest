import Image from "next/image"

export default function Technology() {
  const technologies = [
		{
			name: "Stellar",
			description:
				"Payment-focused blockchain infrastructure for fast, low-friction asset movement and settlement.",
			icon: "/images/avax.png",
		},
		{
			name: "Soroban",
			description:
				"Smart contract platform for building Stellar-native applications with explicit on-chain logic.",
			icon: "/images/aeze.png",
		},
    {
      name: "Next.js",
      description: "React framework for server-side rendering and static site generation with fast performance.",
      icon: "/images/nextjs.png",
    },
    {
      name: "React",
      description: "Modern JavaScript library for building user interfaces with component-based architecture.",
      icon: "/images/react.png",
    },
	];

  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Technology Stack</h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
          Built with cutting-edge blockchain technology to ensure security, transparency, and efficiency
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
        {technologies.map((tech, index) => (
          <div
            key={index}
            className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-red-900/20 shadow-lg hover:border-red-500/50 transition-all"
          >
            {/* <div className="flex justify-center mb-4">
              <Image
                src={tech.icon || "/placeholder.svg"}
                alt={tech.name}
                width={60}
                height={60}
                className="rounded-lg"
              />
            </div> */}
            <h3 className="text-lg md:text-xl font-bold text-center mb-2">{tech.name}</h3>
            <p className="text-gray-300 text-center text-sm md:text-base">{tech.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 md:mt-16 bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-red-900/20 shadow-lg max-w-5xl mx-auto">
        <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Architecture Overview</h3>
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-center">
          <div className="md:w-1/2 w-full">
            <Image
              src="/images/architecture.svg"
              alt="Architecture Diagram"
              width={500}
              height={300}
              className="rounded-lg w-full"
            />
          </div>
          <div className="md:w-1/2 space-y-3 md:space-y-4">
            <p className="text-gray-300 text-sm md:text-base">
              Drip Wave uses a modular architecture with separate components for prize pool management, prize distribution,
              and user interfaces.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 text-sm md:text-base">
              <li>Soroban smart contracts handle deposits, withdrawals, and yield generation</li>
              <li>Prize distribution is fully automated and verifiably random on-chain</li>
              <li>User funds are secured through Stellar's proven security protocols</li>
              <li>All transactions are transparent and auditable on the Stellar network</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
