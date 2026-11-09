import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();
const apiPrefix = "/make-server-833bdb29";

type AppUser = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};

type StoredSurvey = {
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

type PointActivity = {
  id: number;
  title: string;
  detail: string;
  amount: number;
  date: string;
};

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

app.onError((error, c) => {
  console.error("SalingIsi server error:", error);
  return c.json(
    {
      error: error instanceof Error ? error.message : "Terjadi kesalahan pada server.",
    },
    500,
  );
});

app.notFound((c) =>
  c.json(
    {
      error: `Endpoint tidak ditemukan: ${c.req.method} ${c.req.path}`,
    },
    404,
  ),
);

function authClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

async function requireUser(c: any): Promise<AppUser | Response> {
  const authorization = c.req.header("Authorization");
  const token = authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return c.json({ error: "Sesi tidak ditemukan." }, 401);

  const { data, error } = await authClient().auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: "Sesi tidak valid. Silakan masuk kembali." }, 401);
  }
  return data.user as AppUser;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

async function getPoints(userId: string) {
  const saved = await kv.get(`points:${userId}`);
  return typeof saved === "number" ? saved : 200;
}

async function addActivity(userId: string, activity: PointActivity) {
  await kv.set(`activity:${userId}:${activity.id}`, activity);
}

app.on("GET", [`${apiPrefix}/health`, "/health"], (c) => c.json({ status: "ok" }));

app.on("GET", [`${apiPrefix}/surveys`, "/surveys"], async (c) => {
  const user = await requireUser(c);
  if (user instanceof Response) return user;

  const surveys = (await kv.getByPrefix("survey:")) as StoredSurvey[];
  return c.json({
    surveys: surveys.sort((a, b) => b.id - a.id),
  });
});

app.on("GET", [`${apiPrefix}/me`, "/me"], async (c) => {
  const user = await requireUser(c);
  if (user instanceof Response) return user;

  const [points, completionValues, savedActivities] = await Promise.all([
    getPoints(user.id),
    kv.getByPrefix(`completion:${user.id}:`),
    kv.getByPrefix(`activity:${user.id}:`),
  ]);
  let activities = savedActivities as PointActivity[];

  if (activities.length === 0) {
    const welcomeActivity: PointActivity = {
      id: Date.now(),
      title: "Bonus selamat datang",
      detail: "Poin awal akun baru",
      amount: 200,
      date: "Hari ini",
    };
    await Promise.all([
      kv.set(`points:${user.id}`, points),
      addActivity(user.id, welcomeActivity),
    ]);
    activities = [welcomeActivity];
  }

  return c.json({
    points,
    completed: completionValues.map((value: { surveyId: number }) => value.surveyId),
    activities: activities.sort((a, b) => b.id - a.id),
  });
});

app.on("POST", [`${apiPrefix}/surveys`, "/surveys"], async (c) => {
  const user = await requireUser(c);
  if (user instanceof Response) return user;

  const body = await c.req.json();
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  const link = String(body.link ?? "").trim();
  const target = Number(body.target);
  const reward = Number(body.reward);

  if (!title || !description || !link || target < 5 || target > 500) {
    return c.json({ error: "Data survei belum lengkap atau tidak valid." }, 400);
  }
  if (![5, 10, 15, 20].includes(reward)) {
    return c.json({ error: "Jumlah poin per responden tidak valid." }, 400);
  }

  const cost = target * reward;
  const points = await getPoints(user.id);
  if (points < cost) {
    return c.json({ error: `Poin belum cukup. Kamu masih membutuhkan ${cost - points} poin.` }, 400);
  }

  const id = Date.now();
  const author = String(
    user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? "Pengguna SalingIsi",
  );
  const survey: StoredSurvey = {
    id,
    ownerId: user.id,
    title,
    description,
    category: "Umum",
    duration: 5,
    reward,
    author,
    initials: initialsFromName(author),
    color: "bg-violet-100 text-violet-700",
    link,
    responses: 0,
    target,
    status: "Aktif",
    createdAt: new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date()),
  };

  const activity: PointActivity = {
    id,
    title,
    detail: "Mempublikasikan survei",
    amount: -cost,
    date: "Baru saja",
  };

  await kv.mset(
    [`survey:${id}`, `points:${user.id}`, `activity:${user.id}:${activity.id}`],
    [survey, points - cost, activity],
  );

  return c.json({ survey, points: points - cost }, 201);
});

app.on(
  "POST",
  [`${apiPrefix}/surveys/:id/complete`, "/surveys/:id/complete"],
  async (c) => {
  const user = await requireUser(c);
  if (user instanceof Response) return user;

  const id = Number(c.req.param("id"));
  const survey = (await kv.get(`survey:${id}`)) as StoredSurvey | undefined;
  if (!survey) return c.json({ error: "Survei tidak ditemukan." }, 404);
  if (survey.ownerId === user.id) {
    return c.json({ error: "Kamu tidak bisa mengambil poin dari surveimu sendiri." }, 400);
  }
  if (await kv.get(`completion:${user.id}:${id}`)) {
    return c.json({ error: "Poin survei ini sudah pernah kamu klaim." }, 409);
  }
  if (survey.responses >= survey.target) {
    return c.json({ error: "Target responden survei ini sudah terpenuhi." }, 400);
  }

  const points = await getPoints(user.id);
  const updatedSurvey: StoredSurvey = {
    ...survey,
    responses: survey.responses + 1,
    status: survey.responses + 1 >= survey.target ? "Selesai" : "Aktif",
  };
  const activity: PointActivity = {
    id: Date.now(),
    title: survey.title,
    detail: "Menyelesaikan survei",
    amount: survey.reward,
    date: "Baru saja",
  };

  await kv.mset(
    [
      `survey:${id}`,
      `completion:${user.id}:${id}`,
      `points:${user.id}`,
      `activity:${user.id}:${activity.id}`,
    ],
    [updatedSurvey, { surveyId: id }, points + survey.reward, activity],
  );

  return c.json({
    survey: updatedSurvey,
    points: points + survey.reward,
    activity,
  });
  },
);

app.on("DELETE", [`${apiPrefix}/surveys/:id`, "/surveys/:id"], async (c) => {
  const user = await requireUser(c);
  if (user instanceof Response) return user;

  const id = Number(c.req.param("id"));
  const survey = (await kv.get(`survey:${id}`)) as StoredSurvey | undefined;
  if (!survey) return c.json({ error: "Survei tidak ditemukan." }, 404);
  if (survey.ownerId !== user.id) {
    return c.json({ error: "Kamu tidak memiliki izin untuk menghapus survei ini." }, 403);
  }

  await kv.del(`survey:${id}`);
  return c.json({ success: true });
});

Deno.serve(app.fetch);
