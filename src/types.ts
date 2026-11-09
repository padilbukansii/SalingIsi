export type Page = "home" | "create" | "profile";

export type Survey = {
  id: number;
  ownerId: string;
  title: string;
  description: string;
  category: string;
  duration: number;
  reward: number;
  author: string;
  initials: string;
  color: string;
  link: string;
  responses: number;
  target: number;
  status: "Aktif" | "Selesai";
  createdAt: string;
};

export type MySurvey = Survey;

export type SurveyDraft = {
  title: string;
  description: string;
  link: string;
  target: number;
  reward: number;
};

export type PointActivity = {
  id: number;
  title: string;
  detail: string;
  amount: number;
  date: string;
};
