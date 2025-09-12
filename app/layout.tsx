import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "../components/AuthProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BottomNav from "../components/ui/BottomNav";
import ToastProvider from "../components/ui/Toast";
import { MedskyAnalysisProvider } from "@/lib/medsky/analysisContext";
import MedskyAnalysisToast from "@/components/MedskyAnalysisToast";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RootEdu - SKY 학생들이 만드는 교육 플랫폼",
  description: "전문적이고 양심적인 학습·진로 인사이트를 제공하는 교육 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <MedskyAnalysisProvider>
            <ToastProvider>
              <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 pb-16 md:pb-0">
                  {children}
                </main>
                <Footer />
                <BottomNav />
              </div>
              <MedskyAnalysisToast />
            </ToastProvider>
          </MedskyAnalysisProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
