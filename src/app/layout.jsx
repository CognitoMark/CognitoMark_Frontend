import "../index.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "Exam Monitor",
};

const RootLayout = ({ children }) => (
  <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
    <body suppressHydrationWarning>
      <Navbar />
      {children}
    </body>
  </html>
);

export default RootLayout;
