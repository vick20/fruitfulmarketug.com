"use client";

import React, { useState } from "react";
import AdminSettings from "@/src/components/admin/AdminSettings";

export default function SettingsAdminPage() {
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  return (
    <AdminSettings
      isSoundEnabled={isSoundEnabled}
      onToggleSound={() => setIsSoundEnabled((prev) => !prev)}
    />
  );
}
