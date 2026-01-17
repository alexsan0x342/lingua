import { requireAdminOnly } from "@/app/data/admin/require-admin";
import { DeviceTrackingClient } from "./DeviceTrackingClient";

export default async function DeviceTrackingPage() {
  await requireAdminOnly(); // Only ADMIN role can access this page
  
  return <DeviceTrackingClient />;
}












