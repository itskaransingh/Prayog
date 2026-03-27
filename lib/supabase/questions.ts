import { createClient } from "@/lib/supabase/server";

export interface QuestionTableData {
    headers: string[];
    rows: string[][];
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
    video_url: string | null;
    link_url: string | null;
    link_title: string | null;
    created_at: string;
    updated_at: string;
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
    | "video_url"
    | "link_url"
    | "link_title"
>;

export type QuestionUpdate = Partial<
    Omit<Question, "id" | "submodule_id" | "created_at" | "updated_at">
>;

export async function getQuestionsBySubmodule(submoduleId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("submodule_id", submoduleId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data as Question[];
}

export async function getQuestionById(id: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from("questions")
        .select("*")
        .eq("id", id)
        .single();

    if (error) throw error;
    return data as Question[];
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

