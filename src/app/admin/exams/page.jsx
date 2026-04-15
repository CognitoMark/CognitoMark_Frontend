import ProtectedRoute from "../../../components/ProtectedRoute";
import Exams from "../../../screens/admin/Exams";

const Page = () => (
  <ProtectedRoute>
    <Exams />
  </ProtectedRoute>
);

export default Page;
