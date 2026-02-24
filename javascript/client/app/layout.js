import "./globals.css";

export const metadata = {
  title: "Tree of Thoughts — Visual",
  description: "Watch ToT (Game of 24 & Creative Writing) tree in real time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
