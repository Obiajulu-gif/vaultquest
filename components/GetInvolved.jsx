import { Button } from "@/components/ui/button"
import { ArrowRight, Code, Users, Award } from "lucide-react"
import Link from "next/link"

export default function GetInvolved() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Get Involved</h2>
        <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
          Join our community and help shape the future of decentralized prize savings
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
        <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-blue-900/20 shadow-lg">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
            <Users className="text-blue-500" size={20} />
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-3">Join the Community</h3>
          <p className="text-gray-300 mb-4 text-sm md:text-base">
            Connect with other users, share strategies, and participate in governance decisions.
          </p>
          <div className="space-y-2">
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Discord
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Twitter
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Telegram
            </a>
          </div>
        </div>

        <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-blue-900/20 shadow-lg">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
            <Code className="text-blue-500" size={20} />
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-3">Build with Us</h3>
          <p className="text-gray-300 mb-4 text-sm md:text-base">
            Contribute to our open-source codebase or build integrations with our protocol.
          </p>
          <div className="space-y-2">
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> GitHub
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Developer Docs
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Grant Program
            </a>
          </div>
        </div>

        <div className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-blue-900/20 shadow-lg">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
            <Award className="text-blue-500" size={20} />
          </div>
          <h3 className="text-lg md:text-xl font-bold mb-3">Hackathon Challenges</h3>
          <p className="text-gray-300 mb-4 text-sm md:text-base">
            Participate in our hackathon challenges and win prizes for innovative solutions.
          </p>
          <div className="space-y-2">
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Current Challenges
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Past Winners
            </a>
            <a href="#" className="flex items-center text-gray-300 hover:text-white text-sm md:text-base">
              <span className="mr-2">→</span> Submit Project
            </a>
          </div>
        </div>
      </div>

      <div className="mt-12 md:mt-16 bg-gradient-to-r from-blue-900/30 to-blue-800/30 backdrop-blur-sm rounded-xl p-6 md:p-8 border border-blue-900/20 shadow-lg max-w-5xl mx-auto text-center">
        <h3 className="text-xl md:text-2xl font-bold mb-4">Ready to Start Building?</h3>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto text-sm md:text-base">
          Join our community and build innovative applications on top of Drip Wave protocol
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/doc">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
              Read the Docs <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" className="border-blue-600/50 text-white hover:bg-blue-600/10 w-full sm:w-auto">
            Join the Community
          </Button>
        </div>
      </div>
    </section>
  )
}

