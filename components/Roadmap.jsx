import { CheckCircle, Clock } from "lucide-react"

export default function Roadmap() {
  const phases = [
    {
      title: "Phase 1: Stellar Foundation",
      status: "completed",
      timeframe: "Q1-Q2 2025",
      description: "Establishing the core Soroban protocol on Stellar",
      milestones: [
        { name: "Soroban Contract Architecture", completed: true },
        { name: "Drip Wave Core Logic", completed: true },
        { name: "Initial Safety Hardening", completed: true },
        { name: "Stellar Wallet Integration", completed: true },
      ],
    },
    {
      title: "Phase 2: Alpha Launch",
      status: "in-progress",
      timeframe: "Q3 2025",
      description: "Stellar Testnet launch and initial testing",
      milestones: [
        { name: "Testnet Deployment", completed: true },
        { name: "Frontend Beta Release", completed: true },
        { name: "Community Testing Program", completed: false },
        { name: "Initial Pool Strategies", completed: false },
      ],
    },
    {
      title: "Phase 3: Mainnet & Growth",
      status: "planned",
      timeframe: "Q4 2025",
      description: "Public launch on Stellar Mainnet",
      milestones: [
        { name: "Mainnet Deployment", completed: false },
        { name: "Governance Launch", completed: false },
        { name: "Ecosystem Partnerships", completed: false },
        { name: "Advanced Prize Yields", completed: false },
      ],
    },
    {
      title: "Phase 4: Global Scale",
      status: "planned",
      timeframe: "2026+",
      description: "Expanding Drip Wave to global audiences",
      milestones: [
        { name: "Mobile App Release", completed: false },
        { name: "Fiat On-ramps", completed: false },
        { name: "Cross-chain Bridges", completed: false },
        { name: "Institutional Pools", completed: false },
      ],
    },
  ]

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 relative">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Protocol Roadmap</h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
          Our strategic plan for building and scaling the Drip Wave protocol on Stellar
        </p>
      </div>

      <div className="max-w-6xl mx-auto bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-blue-900/20 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
          {phases.map((phase, index) => (
            <div
              key={index}
              className={`rounded-xl p-4 md:p-6 border ${
                phase.status === "completed"
                  ? "border-green-600/30 bg-green-900/10"
                  : phase.status === "in-progress"
                    ? "border-yellow-600/30 bg-yellow-900/10"
                    : "border-gray-600/30 bg-gray-900/10"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <span className="text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full bg-[#1A0505]/50 border border-blue-900/20">
                  {phase.timeframe}
                </span>
                {phase.status === "completed" ? (
                  <span className="text-green-500 flex items-center text-xs sm:text-sm">
                    <CheckCircle size={14} className="mr-1" /> Complete
                  </span>
                ) : phase.status === "in-progress" ? (
                  <span className="text-yellow-500 flex items-center text-xs sm:text-sm">
                    <Clock size={14} className="mr-1" /> In Progress
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center text-xs sm:text-sm">
                    <Clock size={14} className="mr-1" /> Planned
                  </span>
                )}
              </div>

              <h3 className="text-lg md:text-xl font-bold mb-2">{phase.title}</h3>
              <p className="text-gray-300 text-xs sm:text-sm mb-4">{phase.description}</p>

              <div className="space-y-2 md:space-y-3">
                {phase.milestones.map((milestone, i) => (
                  <div key={i} className="flex items-start">
                    <div className={`mt-1 mr-2 md:mr-3 ${milestone.completed ? "text-green-500" : "text-gray-500"}`}>
                      {milestone.completed ? <CheckCircle size={14} /> : <Clock size={14} />}
                    </div>
                    <span className={`text-xs sm:text-sm ${milestone.completed ? "text-gray-200" : "text-gray-400"}`}>
                      {milestone.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 md:mt-12 max-w-6xl mx-auto">
        <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-blue-900/20 shadow-lg">
          <h3 className="text-lg md:text-xl font-bold mb-4">Long-term Vision</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="space-y-2">
              <h4 className="font-bold text-blue-500 text-sm md:text-base">2025</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                Establish Drip Wave as the leading prize savings protocol on Stellar with a
                comprehensive ecosystem of tools and integrations.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-blue-500 text-sm md:text-base">2026</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                Expand to traditional finance through strategic partnerships, bringing prize savings to millions of
                users worldwide through the Stellar network.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-blue-500 text-sm md:text-base">2027+</h4>
              <p className="text-gray-300 text-xs sm:text-sm">
                Transform global savings behavior by making prize-linked savings the default option for individuals and
                institutions on Stellar.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

