import ProtectedRoute from "../../../../components/ProtectedRoute";
import SessionDetail from "../../../../screens/admin/SessionDetail";

const Page = () => (
  <ProtectedRoute>
    <SessionDetail />
  </ProtectedRoute>
);

export default Page;
