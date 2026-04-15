import ProtectedRoute from "../../../components/ProtectedRoute";
import AdminDashboard from "../../../screens/admin/Dashboard";

const Page = () => (
  <ProtectedRoute>
    <AdminDashboard />
  </ProtectedRoute>
);

export default Page;
