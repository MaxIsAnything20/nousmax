export const metadata = {
  title: "NousMax — Study set generator",
  description: "Turn any notes into a summary, flashcards and a quiz.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
