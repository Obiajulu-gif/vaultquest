"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
	const [openIndex, setOpenIndex] = useState(0);

	const faqs = [
		{
			question: "What is Drip Wave?",
			answer:
				"Drip Wave is a no-loss prize savings protocol where users deposit funds into prize pools and stand a chance to win prizes through regular draws without risking their deposit. Your principal is always safe and can be withdrawn at any time.",
		},
		{
			question: "How are prizes generated?",
			answer:
				"Prizes are generated from the yield earned by investing user deposits in various DeFi protocols. The yield is collected and distributed as prizes through regular draws, while your original deposit remains untouched.",
		},
		{
			question: "Is Drip Wave secure?",
			answer:
				"Yes, Drip Wave has been built with security-first principles on Stellar. Our Soroban smart contracts are open-source and undergo rigorous testing. We maintain high security standards to protect user capital.",
		},
		{
			question: "How are winners selected?",
			answer:
				"Winners are selected using a secure on-chain randomness mechanism. This ensures that the selection process is fair, transparent, and cannot be manipulated.",
		},
		{
			question: "What networks does Drip Wave support?",
			answer:
				"Drip Wave is built on Stellar, leveraging its fast transactions and low fees. We focus on providing the best experience within the Stellar ecosystem.",
		},
		{
			question: "How can I participate in governance?",
			answer:
				"Drip Wave is moving towards a DAO structure where community members can participate in key decisions. Stay tuned for more details on our governance roadmap.",
		},
	];

	return (
		<section id="faq" className="container mx-auto px-4 py-16 md:py-24">
			<div className="text-center mb-12 md:mb-16">
				<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
					Frequently Asked Questions
				</h2>
				<p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
					Get answers to the most common questions about Drip Wave
				</p>
			</div>

			<div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
				{faqs.map((faq, index) => (
					<div
						key={index}
						className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl border border-blue-900/20 shadow-lg overflow-hidden"
					>
						<button
							className="w-full p-4 md:p-6 text-left flex justify-between items-start md:items-center gap-4"
							onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
						>
							<h3 className="text-base md:text-xl font-bold text-left">{faq.question}</h3>
							{openIndex === index ? (
								<ChevronUp className="text-blue-500 flex-shrink-0 mt-1 md:mt-0" />
							) : (
								<ChevronDown className="text-blue-500 flex-shrink-0 mt-1 md:mt-0" />
							)}
						</button>
						<div
							className={`px-4 md:px-6 overflow-hidden transition-all duration-300 ease-in-out ${
								openIndex === index ? "max-h-96 pb-4 md:pb-6" : "max-h-0"
							}`}
						>
							<p className="text-gray-300 text-sm md:text-base">{faq.answer}</p>
						</div>
					</div>
				))}
			</div>

			<div className="mt-8 md:mt-12 text-center">
				<p className="text-gray-300 text-sm md:text-base">Still have questions?</p>
				<a href="#" className="text-blue-500 hover:text-blue-400 font-bold text-sm md:text-base">
					Contact our support team →
				</a>
			</div>
		</section>
	);
}
