import AppNav from "@/components/app/AppNav";

export default function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 pb-24 sm:px-6">{children}</main>
    </div>
  );
}
