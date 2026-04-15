import ProtectedRoute from "../../../components/ProtectedRoute";
import Questions from "../../../screens/admin/Questions";

const Page = () => (
  <ProtectedRoute>
    <Questions />
  </ProtectedRoute>
);

export default Page;
