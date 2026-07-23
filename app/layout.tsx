export const metadata = {
  title: "从夯到拉锐评25中所有老师",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="bg-[#f5f0e8] min-h-screen">{children}</body>
    </html>
  );
}
