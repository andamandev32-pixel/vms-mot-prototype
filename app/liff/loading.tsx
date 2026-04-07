export default function LiffLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-sm text-muted">กำลังเชื่อมต่อ LINE...</p>
      </div>
    </div>
  );
}
