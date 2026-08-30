import SettingsPanel from "@/components/app/SettingsPanel";
import { AuthGuard } from "@/components/app/AppShell";

export const metadata = { title: "设置" };

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsPanel />
    </AuthGuard>
  );
}
