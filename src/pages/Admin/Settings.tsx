import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import SectionCard from "../../components/admin/SectionCard";

type PlatformSettings = {
    siteName: string;
    maintenanceMode: boolean;
    enableSignups: boolean;
    creatorVerificationRequired: boolean;
    maxUploadSize: number;
    platformFeePercentage: number;
};

export default function Settings() {
    const [settings, setSettings] = useState<PlatformSettings>({
        siteName: "Creator Platform",
        maintenanceMode: false,
        enableSignups: true,
        creatorVerificationRequired: false,
        maxUploadSize: 5000,
        platformFeePercentage: 10,
    });

    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (key: keyof PlatformSettings, value: any) => {
        setSettings({ ...settings, [key]: value });
        setSaved(false);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // TODO: Call API to save settings
            await new Promise((resolve) => setTimeout(resolve, 500));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    const handleClearCache = async () => {
        if (!confirm("Are you sure you want to clear all cache? This action cannot be undone.")) {
            return;
        }
        try {
            // TODO: Call API to clear cache
            alert("Cache cleared successfully");
        } catch (error) {
            console.error("Error clearing cache:", error);
            alert("Failed to clear cache");
        }
    };

    return (
        <>
            <PageMeta title="Admin Settings" description="Platform configuration" />

            <div className="mb-6">
                <h1 className="text-2xl font-semibold text-gray-800 dark:text-white/90">
                    Platform Settings
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure platform-wide settings and features
                </p>
            </div>

            <div className="space-y-6 max-w-2xl">
                {/* General Settings */}
                <SectionCard title="General Settings" subtitle="Basic platform configuration">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Site Name
                            </label>
                            <input
                                type="text"
                                value={settings.siteName}
                                onChange={(e) => handleChange("siteName", e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Max Upload Size (MB)
                            </label>
                            <input
                                type="number"
                                value={settings.maxUploadSize}
                                onChange={(e) => handleChange("maxUploadSize", parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Platform Fee (%)
                            </label>
                            <input
                                type="number"
                                value={settings.platformFeePercentage}
                                onChange={(e) => handleChange("platformFeePercentage", parseInt(e.target.value))}
                                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </SectionCard>

                {/* Feature Toggles */}
                <SectionCard title="Feature Toggles" subtitle="Enable or disable platform features">
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.maintenanceMode}
                                onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Maintenance Mode
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Temporarily disable the platform for maintenance
                                </div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.enableSignups}
                                onChange={(e) => handleChange("enableSignups", e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Enable New Signups
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Allow new users to register accounts
                                </div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.creatorVerificationRequired}
                                onChange={(e) => handleChange("creatorVerificationRequired", e.target.checked)}
                                className="w-4 h-4 rounded"
                            />
                            <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    Require Creator Verification
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Require creators to verify identity before posting
                                </div>
                            </div>
                        </label>
                    </div>
                </SectionCard>

                {/* Save Button */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
                    >
                        {loading ? "Saving..." : "Save Settings"}
                    </button>
                    {saved && (
                        <span className="text-green-600 dark:text-green-400 text-sm">
                            ✓ Settings saved successfully
                        </span>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Danger Zone
                    </h3>
                    <button
                        onClick={handleClearCache}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                    >
                        Clear All Cache
                    </button>
                </div>
            </div>
        </>
    );
}
