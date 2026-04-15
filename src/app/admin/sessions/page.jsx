import ProtectedRoute from "../../../components/ProtectedRoute";
import Sessions from "../../../screens/admin/Sessions";

const Page = () => (
  <ProtectedRoute>
    <Sessions />
  </ProtectedRoute>
);

export default Page;
