import "./globals.css";

export const metadata = {
  title: "Know Your Plate - Survey",
  description: "Participate in our survey and win exciting prizes!",
  icons: {
    icon: '/KYP Logo Transparent Background.svg',
    shortcut: '/KYP Logo Transparent Background.svg',
    apple: '/KYP Logo Transparent Background.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
