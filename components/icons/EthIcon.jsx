export function EthIcon({ className = "w-6 h-6" }) {
	return (
		<svg
			className={className}
			viewBox="0 0 200 200"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<circle
				cx="100"
				cy="100"
				r="90"
				stroke="#6F6EFF"
				strokeWidth="10"
				fill="#121528"
			/>
			<g stroke="#6F6EFF" strokeWidth="5">
				<ellipse
					cx="100"
					cy="100"
					rx="80"
					ry="40"
					transform="rotate(45 100 100)"
				/>
				<ellipse
					cx="100"
					cy="100"
					rx="80"
					ry="40"
					transform="rotate(-45 100 100)"
				/>
				<ellipse cx="100" cy="100" rx="80" ry="40" />
			</g>
			<circle cx="100" cy="100" r="10" fill="#6F6EFF" />
		</svg>
	);
}
