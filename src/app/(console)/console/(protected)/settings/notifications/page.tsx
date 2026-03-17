"use client";

import { useState, useEffect, useCallback } from "react";
import type { NotificationType } from "@/lib/console/types";

const NOTIFICATION_TYPES: { type: NotificationType; label: string }[] = [
  { type: "clarification", label: "Clarifications" },
  { type: "approval", label: "Approvals" },
  { type: "status_change", label: "Status Changes" },
  { type: "comment", label: "Comments" },
  { type: "completion", label: "Completions" },
];

const CHANNELS = ["email", "slack", "in_app"] as const;
const CHANNEL_LABELS: Record<string, string> = {
  email: "Email",
  slack: "Slack",
  in_app: "In-App",
};

interface Preferences {
  email_enabled: boolean;
  slack_enabled: boolean;
  in_app_enabled: boolean;
  type_overrides: Record<string, { email?: boolean; slack?: boolean; in_app?: boolean }>;
  digest_enabled: boolean;
  digest_frequency: "hourly" | "daily" | "weekly";
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/console/notifications/preferences");
      const data = await res.json();
      if (data.preferences) {
        setPrefs(data.preferences);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const save = async () => {
    if (!prefs) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/console/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save preferences:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleGlobal = (channel: "email_enabled" | "slack_enabled" | "in_app_enabled") => {
    if (!prefs) return;
    setPrefs({ ...prefs, [channel]: !prefs[channel] });
  };

  const toggleOverride = (type: NotificationType, channel: "email" | "slack" | "in_app") => {
    if (!prefs) return;
    const overrides = { ...prefs.type_overrides };
    if (!overrides[type]) overrides[type] = {};
    const current = overrides[type][channel];
    // Cycle: undefined (use default) -> true -> false -> undefined
    if (current === undefined) {
      overrides[type] = { ...overrides[type], [channel]: true };
    } else if (current === true) {
      overrides[type] = { ...overrides[type], [channel]: false };
    } else {
      const copy = { ...overrides[type] };
      delete copy[channel];
      overrides[type] = copy;
    }
    setPrefs({ ...prefs, type_overrides: overrides });
  };

  const getEffectiveState = (type: NotificationType, channel: "email" | "slack" | "in_app"): boolean | "default" => {
    if (!prefs) return "default";
    const override = prefs.type_overrides?.[type]?.[channel];
    if (override !== undefined) return override;
    return "default";
  };

  const getGlobalDefault = (channel: "email" | "slack" | "in_app"): boolean => {
    if (!prefs) return true;
    const map: Record<string, boolean> = {
      email: prefs.email_enabled,
      slack: prefs.slack_enabled,
      in_app: prefs.in_app_enabled,
    };
    return map[channel];
  };

  if (loading) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Notification Settings</h1>
          <p className="text-muted text-sm mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  if (!prefs) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Notification Settings</h1>
          <p className="text-muted text-sm mt-1">Failed to load preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">Notification Settings</h1>
        <p className="text-muted text-sm mt-1">
          Control how and when you receive notifications
        </p>
      </div>

      <div className="space-y-6">
        {/* Global channel toggles */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-4">Channels</h2>
          <p className="text-muted text-xs mb-4">
            Enable or disable notification channels globally.
          </p>
          <div className="space-y-3">
            {[
              { key: "email_enabled" as const, label: "Email" },
              { key: "slack_enabled" as const, label: "Slack" },
              { key: "in_app_enabled" as const, label: "In-App" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer">
                <span className="text-muted-light text-sm">{label}</span>
                <button
                  type="button"
                  onClick={() => toggleGlobal(key)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    prefs[key] ? "bg-orange" : "bg-dark-border"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs[key] ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Per-type overrides */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-2">Per-Type Overrides</h2>
          <p className="text-muted text-xs mb-4">
            Override channel settings for specific notification types. Click to cycle: default, on, off.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-border">
                  <th className="text-left text-muted py-2 pr-4 font-medium">Type</th>
                  {CHANNELS.map((ch) => (
                    <th key={ch} className="text-center text-muted py-2 px-3 font-medium">
                      {CHANNEL_LABELS[ch]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_TYPES.map(({ type, label }) => (
                  <tr key={type} className="border-b border-dark-border/50">
                    <td className="text-muted-light py-2.5 pr-4">{label}</td>
                    {CHANNELS.map((ch) => {
                      const state = getEffectiveState(type, ch);
                      const globalDefault = getGlobalDefault(ch);
                      let display: string;
                      let color: string;
                      if (state === "default") {
                        display = globalDefault ? "On" : "Off";
                        color = "text-muted";
                      } else if (state) {
                        display = "On";
                        color = "text-emerald-400";
                      } else {
                        display = "Off";
                        color = "text-red-400";
                      }
                      return (
                        <td key={ch} className="text-center py-2.5 px-3">
                          <button
                            type="button"
                            onClick={() => toggleOverride(type, ch)}
                            className={`text-xs font-medium px-2 py-0.5 rounded ${color} hover:opacity-80 transition-opacity`}
                          >
                            {state === "default" ? `(${display})` : display}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Digest settings */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-4">Digest Mode</h2>
          <p className="text-muted text-xs mb-4">
            Batch notifications instead of sending each one immediately.
          </p>
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-muted-light text-sm">Enable digest</span>
              <button
                type="button"
                onClick={() => setPrefs({ ...prefs, digest_enabled: !prefs.digest_enabled })}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  prefs.digest_enabled ? "bg-orange" : "bg-dark-border"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    prefs.digest_enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </label>

            {prefs.digest_enabled && (
              <div>
                <label className="text-muted-light text-sm block mb-2">Frequency</label>
                <select
                  value={prefs.digest_frequency}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      digest_frequency: e.target.value as "hourly" | "daily" | "weekly",
                    })
                  }
                  className="bg-dark-border text-foreground text-sm rounded px-3 py-1.5 border border-dark-border focus:border-orange focus:outline-none"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quiet hours */}
        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <h2 className="text-foreground font-medium mb-4">Quiet Hours</h2>
          <p className="text-muted text-xs mb-4">
            Suppress Slack and email notifications during these hours (UTC). In-app notifications still appear.
          </p>
          <div className="flex items-center gap-3">
            <div>
              <label className="text-muted text-xs block mb-1">Start (UTC)</label>
              <select
                value={prefs.quiet_hours_start ?? ""}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    quiet_hours_start: e.target.value === "" ? null : parseInt(e.target.value),
                  })
                }
                className="bg-dark-border text-foreground text-sm rounded px-3 py-1.5 border border-dark-border focus:border-orange focus:outline-none"
              >
                <option value="">None</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
            <span className="text-muted mt-4">to</span>
            <div>
              <label className="text-muted text-xs block mb-1">End (UTC)</label>
              <select
                value={prefs.quiet_hours_end ?? ""}
                onChange={(e) =>
                  setPrefs({
                    ...prefs,
                    quiet_hours_end: e.target.value === "" ? null : parseInt(e.target.value),
                  })
                }
                className="bg-dark-border text-foreground text-sm rounded px-3 py-1.5 border border-dark-border focus:border-orange focus:outline-none"
              >
                <option value="">None</option>
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>
                    {i.toString().padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            onClick={save}
            disabled={saving}
            className="bg-orange hover:bg-orange/90 text-white text-sm font-medium px-5 py-2 rounded transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          {saved && (
            <span className="text-emerald-400 text-sm">Saved successfully</span>
          )}
        </div>
      </div>
    </div>
  );
}
