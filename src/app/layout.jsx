import "../index.css";
import Navbar from "../components/Navbar";
import ErrorBoundary from "../components/ErrorBoundary";
import { ToastProvider } from "../components/Toast";

export const metadata = {
  title: "CognitoMark",
  description: "Advanced Real-Time Exam Monitoring Platform",
};

const RootLayout = ({ children }) => (
  <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
    <body suppressHydrationWarning>
      <ErrorBoundary>
        <ToastProvider>
          <Navbar />
          {children}
        </ToastProvider>
      </ErrorBoundary>
    </body>
  </html>
);

export default RootLayout;
