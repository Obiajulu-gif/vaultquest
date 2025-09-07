export default function RecentWinners() {
  const winners = [
    { id: "cosm...gsye20", date: "January 18", prize: "G0008 Eth" },
    { id: "cosm...23u9fw", date: "January 18", prize: "G0009 Eth" },
    { id: "cosm...93nd34", date: "January 18", prize: "G0008 Eth" },
  ]

  return (
    <div className="bg-[#1A0808] rounded-xl p-6 border border-red-900/20">
      <h3 className="text-lg font-medium mb-4">Recent Winners</h3>
      <table className="w-full">
        <thead>
          <tr className="text-gray-400 text-sm">
            <th className="text-left font-normal pb-2">Winners</th>
            <th className="text-left font-normal pb-2">Date</th>
            <th className="text-left font-normal pb-2">Prize</th>
          </tr>
        </thead>
        <tbody>
          {winners.map((winner, i) => (
            <tr key={i} className="border-t border-red-900/10">
              <td className="py-3">{winner.id}</td>
              <td className="py-3">{winner.date}</td>
              <td className="py-3">{winner.prize}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

