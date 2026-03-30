import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";

export const metadata = {
  title: "Roommate Link | Roommate Finder Ghana | Roommate Finder Uni",
  description: "Connect with highly compatible students in Ghana and beyond using our proprietary behavioral matching engine. Roommate Link is the most trusted roommate finder for university students.",
  keywords: ["Roommate Link", "Roommate Finder Ghana", "Roommate Finder Uni", "Roommate Finder", "University Roommate Matcher", "Student Housing Ghana"],
  authors: [{ name: "Roommate Link Team" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo.png" },
      { url: "/logo.png", sizes: "32x32", type: "image/png" },
      { url: "/logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Roommate Link | #1 Roommate Finder Ghana",
    description: "The official roommate finder for university students in Ghana. Stop gambling on your living situation.",
    url: "https://roommatelink.com",
    siteName: "Roommate Link",
    images: [
      {
        url: "/homeimage.jpg",
        width: 1200,
        height: 630,
        alt: "Roommate Link Hero",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Roommate Link | Roommate Finder Ghana",
    description: "Find roommates who actually match your lifestyle. The most trusted platform in Ghana.",
    images: ["/homeimage.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};


export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};




export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
          <Toaster
            position="top-center"
            richColors
            toastOptions={{
              style: {
                borderRadius: '999px',
                padding: '12px 20px',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
