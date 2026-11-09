import type { PointActivity, Survey, SurveyDraft } from "../types"
import { projectId } from "../../utils/supabase/info"
import { supabase } from "./supabase"

const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-833bdb29`

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) throw new Error("Sesi tidak ditemukan. Silakan masuk kembali.")

  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...options?.headers,
    },
  })

  const responseText = await response.text()
  let data: any
  try {
    data = responseText ? JSON.parse(responseText) : {}
  } catch {
    throw new Error(
      response.ok
        ? "Respons server tidak valid."
        : `Server tidak dapat memproses permintaan (${response.status})${
            responseText ? `: ${responseText.slice(0, 120)}` : "."
          }`,
    )
  }
  if (!response.ok) throw new Error(data.error ?? "Terjadi kesalahan pada server.")
  return data as T
}

export function getSurveys() {
  return request<{ surveys: Survey[] }>("/surveys")
}

export function getMyState() {
  return request<{
    points: number
    completed: number[]
    activities: PointActivity[]
  }>("/me")
}

export function createSurvey(survey: SurveyDraft) {
  return request<{ survey: Survey; points: number }>("/surveys", {
    method: "POST",
    body: JSON.stringify(survey),
  })
}

export function completeSurvey(id: number) {
  return request<{
    survey: Survey
    points: number
    activity: PointActivity
  }>(`/surveys/${id}/complete`, {
    method: "POST",
  })
}

export function deleteSurvey(id: number) {
  return request<{ success: boolean }>(`/surveys/${id}`, {
    method: "DELETE",
  })
}
