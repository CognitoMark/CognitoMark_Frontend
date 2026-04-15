import ProtectedRoute from "../../../components/ProtectedRoute";
import Students from "../../../screens/admin/Students";

const Page = () => (
  <ProtectedRoute>
    <Students />
  </ProtectedRoute>
);

export default Page;
