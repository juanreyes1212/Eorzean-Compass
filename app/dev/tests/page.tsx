"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Plus, RefreshCw, FlaskConical, ChartBar as BarChart3, TriangleAlert as AlertTriangle } from "lucide-react";

interface QATestCase {
  id: string;
  feature: string;
  description: string;
  status: "pass" | "fail" | "pending" | "skipped";
  notes: string;
  tested_at: string | null;
  created_at: string;
}

interface AnalyticsSummary {
  total_events: number;
  event_counts: Record<string, number>;
  recent_searches: Array<{ event_data: Record<string, unknown>; created_at: string }>;
  error_count: number;
}

const STATUS_CONFIG = {
  pass: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-900/30 border-green-700" },
  fail: { icon: XCircle, color: "text-red-400", bg: "bg-red-900/30 border-red-700" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-900/30 border-yellow-700" },
  skipped: { icon: AlertTriangle, color: "text-compass-400", bg: "bg-compass-900/30 border-compass-700" },
};

function StatusBadge({ status }: { status: QATestCase["status"] }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.bg} ${config.color} gap-1`}>
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
}

export default function DevTestDashboard() {
  const [testCases, setTestCases] = useState<QATestCase[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFeature, setNewFeature] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const isDev = process.env.NODE_ENV === "development";

  const fetchTestCases = useCallback(async () => {
    const { data } = await supabase
      .from("qa_test_cases")
      .select("*")
      .order("feature")
      .order("created_at");
    if (data) setTestCases(data);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    const { data: events } = await supabase
      .from("analytics_events")
      .select("event_type, event_data, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (events) {
      const counts: Record<string, number> = {};
      let errorCount = 0;
      events.forEach((e) => {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
        if (e.event_type === "error") errorCount++;
      });
      const searches = events
        .filter((e) => e.event_type === "search")
        .slice(0, 10);
      setAnalytics({
        total_events: events.length,
        event_counts: counts,
        recent_searches: searches,
        error_count: errorCount,
      });
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTestCases(), fetchAnalytics()]).finally(() =>
      setLoading(false)
    );
  }, [fetchTestCases, fetchAnalytics]);

  const addTestCase = async () => {
    if (!newFeature.trim() || !newDescription.trim()) return;
    await supabase.from("qa_test_cases").insert({
      feature: newFeature.trim(),
      description: newDescription.trim(),
      status: "pending",
    });
    setNewFeature("");
    setNewDescription("");
    fetchTestCases();
  };

  const updateStatus = async (id: string, status: QATestCase["status"]) => {
    await supabase
      .from("qa_test_cases")
      .update({ status, tested_at: new Date().toISOString() })
      .eq("id", id);
    fetchTestCases();
  };

  const updateNotes = async (id: string, notes: string) => {
    await supabase.from("qa_test_cases").update({ notes }).eq("id", id);
  };

  if (!isDev) {
    return (
      <div className="min-h-screen bg-compass-950 flex items-center justify-center">
        <Card className="compass-card p-8 max-w-md">
          <p className="text-compass-300 text-center">
            This page is only available in development mode.
          </p>
        </Card>
      </div>
    );
  }

  const features = [...new Set(testCases.map((t) => t.feature))];
  const statusSummary = {
    pass: testCases.filter((t) => t.status === "pass").length,
    fail: testCases.filter((t) => t.status === "fail").length,
    pending: testCases.filter((t) => t.status === "pending").length,
    skipped: testCases.filter((t) => t.status === "skipped").length,
  };

  return (
    <div className="min-h-screen bg-compass-950 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <FlaskConical className="h-8 w-8 text-gold-400" />
            <div>
              <h1 className="text-2xl font-bold text-compass-100">
                Test Dashboard
              </h1>
              <p className="text-sm text-compass-400">
                QA tracking and analytics
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              Promise.all([fetchTestCases(), fetchAnalytics()]).finally(() =>
                setLoading(false)
              );
            }}
            className="border-compass-600 text-compass-300 hover:bg-compass-700"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {(["pass", "fail", "pending", "skipped"] as const).map((status) => {
            const config = STATUS_CONFIG[status];
            const Icon = config.icon;
            return (
              <Card key={status} className="compass-card">
                <CardContent className="pt-4 pb-4 flex items-center gap-3">
                  <Icon className={`h-5 w-5 ${config.color}`} />
                  <div>
                    <div className="text-xl font-bold text-compass-100">
                      {statusSummary[status]}
                    </div>
                    <div className="text-xs text-compass-400 capitalize">
                      {status}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Tabs defaultValue="qa" className="w-full">
          <TabsList className="bg-compass-800 border-compass-700 mb-6">
            <TabsTrigger
              value="qa"
              className="data-[state=active]:bg-compass-700 text-compass-100"
            >
              QA Test Cases
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-compass-700 text-compass-100"
            >
              Analytics Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="qa">
            <Card className="compass-card mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-compass-100 text-sm">
                  Add Test Case
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Input
                    placeholder="Feature area"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    className="bg-compass-900 border-compass-700 text-compass-100 w-48"
                  />
                  <Input
                    placeholder="Test description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="bg-compass-900 border-compass-700 text-compass-100 flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addTestCase()}
                  />
                  <Button
                    onClick={addTestCase}
                    className="bg-gold-600 hover:bg-gold-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {features.map((feature) => (
              <Card key={feature} className="compass-card mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-compass-100 text-base">
                    {feature}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {testCases
                    .filter((t) => t.feature === feature)
                    .map((tc) => (
                      <div
                        key={tc.id}
                        className="flex items-center gap-3 p-3 rounded bg-compass-900/50 border border-compass-800"
                      >
                        <StatusBadge status={tc.status} />
                        <span className="text-compass-200 flex-1 text-sm">
                          {tc.description}
                        </span>
                        <Select
                          value={tc.status}
                          onValueChange={(v) =>
                            updateStatus(tc.id, v as QATestCase["status"])
                          }
                        >
                          <SelectTrigger className="w-28 h-8 bg-compass-900 border-compass-700 text-compass-200 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-compass-900 border-compass-700">
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="fail">Fail</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="skipped">Skipped</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Notes"
                          defaultValue={tc.notes}
                          onBlur={(e) => updateNotes(tc.id, e.target.value)}
                          className="w-48 h-8 bg-compass-900 border-compass-700 text-compass-200 text-xs"
                        />
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}

            {features.length === 0 && !loading && (
              <Card className="compass-card">
                <CardContent className="py-12 text-center text-compass-400">
                  No test cases yet. Add one above to get started.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {analytics ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="compass-card">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 className="h-4 w-4 text-gold-400" />
                        <span className="text-xs text-compass-400">
                          Total Events
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-compass-100">
                        {analytics.total_events}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="compass-card">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-compass-400">Errors</span>
                      </div>
                      <div className="text-2xl font-bold text-compass-100">
                        {analytics.error_count}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="compass-card">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <FlaskConical className="h-4 w-4 text-compass-400" />
                        <span className="text-xs text-compass-400">
                          Event Types
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-compass-100">
                        {Object.keys(analytics.event_counts).length}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="compass-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-compass-100 text-base">
                      Event Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(analytics.event_counts)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div
                            key={type}
                            className="flex items-center justify-between p-2 rounded bg-compass-900/50"
                          >
                            <span className="text-compass-200 text-sm">
                              {type}
                            </span>
                            <Badge
                              variant="outline"
                              className="bg-compass-800 border-compass-700 text-compass-300"
                            >
                              {count}
                            </Badge>
                          </div>
                        ))}
                      {Object.keys(analytics.event_counts).length === 0 && (
                        <p className="text-compass-400 text-sm text-center py-4">
                          No analytics events recorded yet.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="compass-card">
                <CardContent className="py-12 text-center text-compass-400">
                  Loading analytics data...
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
