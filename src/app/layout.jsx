import "../index.css";
import Navbar from "../components/Navbar";

export const metadata = {
  title: "CognitoMark",
  description: "Advanced Real-Time Exam Monitoring Platform",
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
