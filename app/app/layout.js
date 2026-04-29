import "../globals.css"

export const metadata = {
  title: "Drip Wave - DApp",
  description: "Save & win with no-loss prize savings on Stellar",
}

export default function AppLayout({ children }) {
  return <div className="dark">{children}</div>
}

