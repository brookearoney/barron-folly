import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import type { AiClarificationData } from "@/lib/console/types";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { request_id, answers, clarification_data: clientClarData } = await req.json();
    if (!request_id || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: "request_id and answers[] are required" },
        { status: 400 }
      );
    }

    // Get the request and verify ownership
    const { data: request, error: reqError } = await supabase
      .from("requests")
      .select("*")
      .eq("id", request_id)
      .single();

    if (reqError || !request) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    if (request.ai_phase !== "clarifying") {
      return NextResponse.json(
        { error: `Invalid AI phase: ${request.ai_phase}. Expected 'clarifying'.` },
        { status: 400 }
      );
    }

    // Use DB data if available, otherwise fall back to client-provided data
    // (the clarify stream saves async and may not have completed yet)
    const baseClarData = request.ai_clarification_data || clientClarData;
    if (!baseClarData) {
      return NextResponse.json(
        { error: "No clarification data found. Run clarify first." },
        { status: 400 }
      );
    }

    // Merge answers into clarification data
    const clarificationData = baseClarData as AiClarificationData;
    const answersMap = new Map(
      answers.map((a: { id: string; answer: string }) => [a.id, a.answer])
    );

    const updatedQuestions = clarificationData.questions.map((q) => ({
      ...q,
      answer: answersMap.get(q.id) ?? q.answer ?? null,
    }));

    const updatedData: AiClarificationData = {
      ...clarificationData,
      questions: updatedQuestions,
      answered_at: new Date().toISOString(),
    };

    // Update request with answered clarification data and advance phase
    const { error: updateError } = await supabase
      .from("requests")
      .update({
        ai_clarification_data: updatedData,
        ai_phase: "clarified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request_id);

    if (updateError) throw updateError;

    return NextResponse.json({ clarification_data: updatedData });
  } catch (error) {
    console.error("AI clarify answer error:", error);
    return NextResponse.json(
      { error: "Failed to save answers" },
      { status: 500 }
    );
  }
}
