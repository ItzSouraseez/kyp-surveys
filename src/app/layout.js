import "./globals.css";

export const metadata = {
  title: "Know Your Plate - Survey",
  description: "Participate in our survey and win exciting prizes!",
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
