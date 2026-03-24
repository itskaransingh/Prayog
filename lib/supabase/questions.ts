import { createClient } from "@/lib/supabase/server";

export interface QuestionTableData {
    headers: string[];
    rows: string[][];
}

export interface EvaluationMapping {
    fieldPath: string;
    label: string;
    expectedValue: string;
    weight?: number;
}

export interface EvaluationData {
    mappings: EvaluationMapping[];
}

export interface EvaluationCriteria {
    id: string;
    question_id: string;
    evaluation_data: EvaluationData;
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: string;
    submodule_id: string;
    title: string;
    paragraph: string;
    has_table: boolean;
    table_data: QuestionTableData | null;
    has_image: boolean;
    image_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface QuestionWithEvaluation extends Question {
    evaluation_criteria: EvaluationCriteria[];
}

export type QuestionInsert = Pick<
    Question,
    | "submodule_id"
    | "title"
    | "paragraph"
    | "has_table"
    | "table_data"
    | "has_image"
    | "image_url"
>;

export type QuestionUpdate = Partial<
    Omit<Question, "id" | "submodule_id" | "created_at" | "updated_at">
>;

export type EvaluationCriteriaInsert = Pick<
    EvaluationCriteria,
    "question_id" | "evaluation_data"
>;

export type EvaluationCriteriaUpdate = Partial<
    Omit<EvaluationCriteria, "id" | "question_id" | "created_at" | "updated_at">
>;

export async function getQuestionsBySubmodule(submoduleId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .select("*, evaluation_criteria(*)")
        .eq("submodule_id", submoduleId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data as QuestionWithEvaluation[];
}

export async function getQuestionById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .select("*, evaluation_criteria(*)")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data as QuestionWithEvaluation;
}

export async function createQuestion(questionData: QuestionInsert) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .insert(questionData)
        .select()
        .single();

    if (error) throw error;
    return data as Question;
}

export async function updateQuestion(id: string, questionData: QuestionUpdate) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .update(questionData)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data as Question;
}

export async function deleteQuestion(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("questions").delete().eq("id", id);
    if (error) throw error;
}

export async function getEvaluationCriteriaByQuestion(questionId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("evaluation_criteria")
        .select("*")
        .eq("question_id", questionId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data as EvaluationCriteria[];
}

export async function createEvaluationCriteria(
    criteriaData: EvaluationCriteriaInsert
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("evaluation_criteria")
        .insert(criteriaData)
        .select()
        .single();

    if (error) throw error;
    return data as EvaluationCriteria;
}

export async function updateEvaluationCriteria(
    id: string,
    criteriaData: EvaluationCriteriaUpdate
) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("evaluation_criteria")
        .update(criteriaData)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data as EvaluationCriteria;
}

export async function upsertEvaluationCriteria(
    questionId: string,
    evaluationData: EvaluationData
) {
    const existing = await getEvaluationCriteriaByQuestion(questionId);

    if (existing.length > 0) {
        return updateEvaluationCriteria(existing[0].id, {
            evaluation_data: evaluationData,
        });
    }

    return createEvaluationCriteria({
        question_id: questionId,
        evaluation_data: evaluationData,
    });
}

export async function deleteEvaluationCriteria(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("evaluation_criteria")
        .delete()
        .eq("id", id);

    if (error) throw error;
}
