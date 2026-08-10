export const metadata = {
  title: "NousMax — Study set generator",
  description: "Turn any notes into a summary, flashcards and a quiz.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
