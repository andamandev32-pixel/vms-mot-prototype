import { VisitorAuthProvider } from "@/components/providers/VisitorAuthProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import VisitorNav from "@/components/visitor/VisitorNav";

export default function VisitorAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <VisitorAuthProvider>
        <div className="min-h-screen bg-bg web-theme">
          <VisitorNav />
          <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
        </div>
      </VisitorAuthProvider>
    </QueryProvider>
  );
}
