"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
	const [openIndex, setOpenIndex] = useState(0);

	const faqs = [
		{
			question: "What is VaultQuest?",
			answer:
				"VaultQuest is a no-loss prize savings protocol where users deposit funds into prize vaults and stand a chance to win prizes through regular draws without risking their deposit. Your principal is always safe and can be withdrawn at any time.",
		},
		{
			question: "How are prizes generated?",
			answer:
				"Prizes are generated from the yield earned by investing user deposits in various DeFi protocols. The yield is collected and distributed as prizes through regular draws, while your original deposit remains untouched.",
		},
		{
			question: "Is VaultQuest secure?",
			answer:
				"Yes, VaultQuest has undergone multiple security audits by leading firms in the space. Our smart contracts are open-source and have been thoroughly tested. We also maintain a bug bounty program to continuously improve security.",
		},
		{
			question: "How are winners selected?",
			answer:
				"Winners are selected using Chainlink's Verifiable Random Function (VRF), which provides cryptographically secure randomness. This ensures that the selection process is fair, transparent, and cannot be manipulated.",
		},
		{
			question: "What networks does VaultQuest support?",
			answer:
				"VaultQuest currently supports Eth, with plans to expand to Cosmos, Polygon, and other major networks in the near future. Our multi-chain strategy aims to provide users with options that best suit their needs.",
		},
		{
			question: "How can I participate in governance?",
			answer:
				"VaultQuest is governed by a DAO where token holders can propose and vote on changes to the protocol. You can participate by acquiring governance tokens and joining our governance forum discussions.",
		},
	];

	return (
		<section id="faq" className="container mx-auto px-4 py-16 md:py-24">
			<div className="text-center mb-12 md:mb-16">
				<h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
					Frequently Asked Questions
				</h2>
				<p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
					Get answers to the most common questions about VaultQuest
				</p>
			</div>

			<div className="max-w-3xl mx-auto space-y-3 md:space-y-4">
				{faqs.map((faq, index) => (
					<div
						key={index}
						className="bg-[#1A0808]/70 backdrop-blur-sm rounded-xl border border-red-900/20 shadow-lg overflow-hidden"
					>
						<button
							className="w-full p-4 md:p-6 text-left flex justify-between items-start md:items-center gap-4"
							onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
						>
							<h3 className="text-base md:text-xl font-bold text-left">{faq.question}</h3>
							{openIndex === index ? (
								<ChevronUp className="text-red-500 flex-shrink-0 mt-1 md:mt-0" />
							) : (
								<ChevronDown className="text-red-500 flex-shrink-0 mt-1 md:mt-0" />
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
				<a href="#" className="text-red-500 hover:text-red-400 font-bold text-sm md:text-base">
					Contact our support team →
				</a>
			</div>
		</section>
	);
}
