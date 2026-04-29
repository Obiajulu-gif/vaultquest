import Image from "next/image"

export default function WhyPrizeSavings() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Why Prize Savings?</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
        <div className="bg-[#0A0A2A] rounded-xl p-6 md:p-8">
          <h3 className="text-xl md:text-2xl font-bold mb-4 text-blue-500">The Mission:</h3>
          <h4 className="text-lg md:text-xl font-bold mb-4">Financial freedom for all</h4>
          <p className="text-gray-300 text-sm md:text-base">
            Our goal is to democratize access to financial tools and create opportunities for everyone to build wealth,
            regardless of their background or starting point.
          </p>
        </div>

        <div className="bg-[#0A0A2A] rounded-xl p-6 md:p-8 flex items-center justify-center">
          <div className="relative">
            <Image
              src="/images/shield.png"
              alt="Shield with Chart"
              width={200}
              height={200}
              className="opacity-80 w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

