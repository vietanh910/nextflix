import AdminGate from "./AdminGate";
import AdminDashboardClient from "./AdminDashboardClient";

export default function AdminPage() {
  return (
    <AdminGate>
      <AdminDashboardClient />
    </AdminGate>
  );
}
