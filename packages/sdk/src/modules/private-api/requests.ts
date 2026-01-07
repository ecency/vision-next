import { CONFIG, getBoundFetch } from "@/modules/core";
import { ApiNotification, ApiNotificationSetting } from "@/modules/notifications";
import { Draft, DraftMetadata } from "@/modules/posts/types/draft";
import { Schedule } from "@/modules/posts/types/schedule";
import { ApiResponse } from "./types";

type RequestError = Error & { status?: number; data?: unknown };

async function parseJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorData: unknown = undefined;
    try {
      errorData = await response.json();
    } catch {
      errorData = undefined;
    }
    const error = new Error(`Request failed with status ${response.status}`) as RequestError;
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return (await response.json()) as T;
}

export async function signUp(
  username: string,
  email: string,
  referral: string
): Promise<ApiResponse<Record<string, unknown>>> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/account-create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, email, referral }),
  });

  const data = await parseJsonResponse<Record<string, unknown>>(response);
  return { status: response.status, data };
}

export async function subscribeEmail(
  email: string
): Promise<ApiResponse<Record<string, unknown>>> {
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/subscribe", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  const data = await parseJsonResponse<Record<string, unknown>>(response);
  return { status: response.status, data };
}

export async function usrActivity(
  code: string | undefined,
  ty: number,
  bl: string | number = "",
  tx: string | number = ""
): Promise<void> {
  const params: {
    code: string | undefined;
    ty: number;
    bl?: string | number;
    tx?: string | number;
  } = { code, ty };

  if (bl) {
    params.bl = bl;
  }
  if (tx) {
    params.tx = tx;
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/usr-activity", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  await parseJsonResponse(response);
}

export async function getNotifications(
  code: string | undefined,
  filter: string | null,
  since: string | null = null,
  user: string | null = null
): Promise<ApiNotification[]> {
  const data: { code: string | undefined; filter?: string; since?: string; user?: string } = {
    code,
  };

  if (filter) {
    data.filter = filter;
  }

  if (since) {
    data.since = since;
  }

  if (user) {
    data.user = user;
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<ApiNotification[]>(response);
}

export async function saveNotificationSetting(
  code: string | undefined,
  username: string,
  system: string,
  allows_notify: number,
  notify_types: number[],
  token: string
): Promise<ApiNotificationSetting> {
  const data = {
    code,
    username,
    token,
    system,
    allows_notify,
    notify_types,
  };

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/register-device", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<ApiNotificationSetting>(response);
}

export async function getNotificationSetting(
  code: string | undefined,
  username: string,
  token: string
): Promise<ApiNotificationSetting> {
  const data = { code, username, token };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/detail-device", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<ApiNotificationSetting>(response);
}

export async function markNotifications(
  code: string | undefined,
  id?: string
): Promise<Record<string, unknown>> {
  const data: { code: string | undefined; id?: string } = {
    code,
  };
  if (id) {
    data.id = id;
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/notifications/mark", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function addImage(code: string | undefined, url: string): Promise<Record<string, unknown>> {
  const data = { code, url };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function uploadImage(
  file: File,
  token: string,
  signal?: AbortSignal
): Promise<{ url: string }> {
  const fetchApi = getBoundFetch();
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetchApi(`${CONFIG.imageHost}/hs/${token}`, {
    method: "POST",
    body: formData,
    signal,
  });

  return parseJsonResponse<{ url: string }>(response);
}

export async function deleteImage(
  code: string | undefined,
  imageId: string
): Promise<Record<string, unknown>> {
  const data = { code, id: imageId };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/images-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function addDraft(
  code: string | undefined,
  title: string,
  body: string,
  tags: string,
  meta: DraftMetadata
): Promise<{ drafts: Draft[] }> {
  const data = { code, title, body, tags, meta };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<{ drafts: Draft[] }>(response);
}

export async function updateDraft(
  code: string | undefined,
  draftId: string,
  title: string,
  body: string,
  tags: string,
  meta: DraftMetadata
): Promise<{ drafts: Draft[] }> {
  const data = { code, id: draftId, title, body, tags, meta };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<{ drafts: Draft[] }>(response);
}

export async function deleteDraft(
  code: string | undefined,
  draftId: string
): Promise<Record<string, unknown>> {
  const data = { code, id: draftId };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/drafts-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function addSchedule(
  code: string | undefined,
  permlink: string,
  title: string,
  body: string,
  meta: Record<string, unknown>,
  options: Record<string, unknown> | null,
  schedule: string,
  reblog: boolean
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {
    code,
    permlink,
    title,
    body,
    meta,
    schedule,
    reblog,
  };

  if (options) {
    data.options = options;
  }

  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function deleteSchedule(
  code: string | undefined,
  id: string
): Promise<Record<string, unknown>> {
  const data = { code, id };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Record<string, unknown>>(response);
}

export async function moveSchedule(code: string | undefined, id: string): Promise<Schedule[]> {
  const data = { code, id };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules-move", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<Schedule[]>(response);
}

export async function getPromotedPost(
  code: string | undefined,
  author: string,
  permlink: string
): Promise<{ author: string; permlink: string } | ""> {
  const data = { code, author, permlink };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(CONFIG.privateApiHost + "/private-api/promoted-post", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return parseJsonResponse<{ author: string; permlink: string } | "">(response);
}

export async function onboardEmail(
  username: string,
  email: string,
  friend: string
): Promise<Record<string, unknown>> {
  const dataBody = {
    username,
    email,
    friend,
  };
  const fetchApi = getBoundFetch();
  const response = await fetchApi(
    CONFIG.privateApiHost + "/private-api/account-create-friend",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataBody),
    }
  );

  return parseJsonResponse<Record<string, unknown>>(response);
}
