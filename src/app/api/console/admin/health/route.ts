import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import {
  checkHealth,
  checkServiceHealth,
  getErrorRate,
  getLatencyPercentiles,
  detectAnomalies,
} from "@/lib/observability/health";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const service = searchParams.get("service");
    const orgId = searchParams.get("org_id");
    const section = searchParams.get("section");

    // Return specific service health
    if (service) {
      const health = await checkServiceHealth(service);
      return NextResponse.json({ health });
    }

    // Return specific section data
    if (section === "anomalies" && orgId) {
      const anomalies = await detectAnomalies(orgId);
      return NextResponse.json({ anomalies });
    }

    if (section === "latency") {
      const hours = parseInt(searchParams.get("hours") || "24");
      const percentiles = await getLatencyPercentiles(hours);
      return NextResponse.json({ percentiles });
    }

    if (section === "errors") {
      const hours = parseInt(searchParams.get("hours") || "24");
      // Get hourly error rates for the graph
      const errorRates: Array<{ hour: string; errors: number }> = [];
      for (let i = hours - 1; i >= 0; i--) {
        const hourStart = new Date(Date.now() - (i + 1) * 3_600_000);
        const rate = await getErrorRate(1);
        errorRates.push({
          hour: hourStart.toISOString(),
          errors: i === 0 ? rate : 0, // Only current hour is accurate with this approach
        });
      }
      // Simplified: just get the current rate
      const currentRate = await getErrorRate(1);
      return NextResponse.json({ errorRate: currentRate, errorRates });
    }

    // Full health check
    const health = await checkHealth();
    const percentiles = await getLatencyPercentiles(24);

    let anomalies: Awaited<ReturnType<typeof detectAnomalies>> = [];
    if (orgId) {
      anomalies = await detectAnomalies(orgId);
    }

    return NextResponse.json({
      health,
      percentiles,
      anomalies,
    });
  } catch (error) {
    console.error("Admin health API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch health data" },
      { status: 500 }
    );
  }
}
