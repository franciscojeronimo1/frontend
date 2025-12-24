import type { Metadata } from "next";
import "./globals.scss";
import { Toaster } from "sonner";



export const metadata: Metadata = {
  title: "Delivery",
  description: "Delivery",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Toaster position="top-right" toastOptions={{
          style:{
            backgroundColor: "#f1f1f1",
            color:"#131313",
            borderColor:"rgba(255,255,255, 0.5)"
          }
        }} />
        {children}
      </body>
    </html>
  );
}
