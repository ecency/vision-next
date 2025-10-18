import { apiBase } from "./helper";
import { NotificationFilter, NotifyTypes } from "@/enums";
import {
  Announcement,
  ApiNotification,
  ApiNotificationSetting,
  Bookmark,
  CommentHistory,
  Draft,
  DraftMetadata,
  Fragment,
  GetRecoveriesEmailResponse,
  PointTransaction,
  Recoveries,
  Schedule,
  CommentOptions,
  MetaData
} from "@/entities";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { EcencyConfigManager } from "@/config";

export const signUp = (username: string, email: string, referral: string): Promise<any> =>
  appAxios
    .post(apiBase(`/private-api/account-create`), {
      username: username,
      email: email,
      referral: referral
    })
    .then((resp) => {
      return resp;
    });

export const subscribeEmail = (email: string): Promise<any> =>
  appAxios
    .post(apiBase(`/private-api/subscribe`), {
      email: email
    })
    .then((resp) => {
      return resp;
    });

export const usrActivity = (
  username: string,
  ty: number,
  bl: string | number = "",
  tx: string | number = ""
) => {
  if (!EcencyConfigManager.CONFIG.visionFeatures.userActivityTracking.enabled) {
    return new Promise((resolve) => resolve(null));
  }

  const params: {
    code: string | undefined;
    ty: number;
    bl?: string | number;
    tx?: string | number;
  } = { code: getAccessToken(username), ty };

  if (bl) params.bl = bl;
  if (tx) params.tx = tx;

  return appAxios.post(apiBase(`/private-api/usr-activity`), params);
};

export const getNotifications = (
  username: string,
  filter: NotificationFilter | null,
  since: string | null = null,
  user: string | null = null
): Promise<ApiNotification[]> => {
  const data: { code: string | undefined; filter?: string; since?: string; user?: string } = {
    code: getAccessToken(username)
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

  return appAxios.post(apiBase(`/private-api/notifications`), data).then((resp) => resp.data);
};

export const saveNotificationSetting = (
  username: string,
  system: string,
  allows_notify: number,
  notify_types: number[],
  token: string
): Promise<ApiNotificationSetting> => {
  const data = {
    code: getAccessToken(username),
    username,
    token,
    system,
    allows_notify,
    notify_types
  };
  return appAxios.post(apiBase(`/private-api/register-device`), data).then((resp) => resp.data);
};

export const getNotificationSetting = (
  username: string,
  token: string
): Promise<ApiNotificationSetting> => {
  const data = { code: getAccessToken(username), username, token };
  return appAxios.post(apiBase(`/private-api/detail-device`), data).then((resp) => resp.data);
};

export const getCurrencyTokenRate = (currency: string, token: string): Promise<number> =>
  appAxios
    .get(apiBase(`/private-api/market-data/${currency === "hbd" ? "usd" : currency}/${token}`))
    .then((resp: any) => resp.data);

export const getCurrencyRates = (): Promise<{
  [currency: string]: {
    quotes: {
      [currency: string]: {
        last_updated: string;
        percent_change: number;
        price: number;
      };
    };
  };
}> => appAxios.get(apiBase("/private-api/market-data/latest")).then((resp: any) => resp.data);

export interface UserImage {
  created: string;
  timestamp: number;
  url: string;
  _id: string;
}

export const getImages = (username: string): Promise<UserImage[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/images`), data).then((resp) => resp.data);
};

export const deleteImage = (username: string, imageID: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: imageID };
  return appAxios.post(apiBase(`/private-api/images-delete`), data).then((resp) => resp.data);
};

export const addImage = (username: string, url: string): Promise<any> => {
  const data = { code: getAccessToken(username), url: url };
  return appAxios
    .post(apiBase(`/private-api/images-add`), data, { timeout: Infinity })
    .then((resp) => resp.data);
};

export const getDrafts = (username: string): Promise<Draft[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/drafts`), data).then((resp) => resp.data);
};

export const addDraft = (
  username: string,
  title: string,
  body: string,
  tags: string,
  meta: DraftMetadata
): Promise<{ drafts: Draft[] }> => {
  const data = { code: getAccessToken(username), title, body, tags, meta };
  return appAxios.post(apiBase(`/private-api/drafts-add`), data).then((resp) => resp.data);
};

export const updateDraft = (
  username: string,
  draftId: string,
  title: string,
  body: string,
  tags: string,
  meta: DraftMetadata
): Promise<{ drafts: Draft[] }> => {
  const data = { code: getAccessToken(username), id: draftId, title, body, tags, meta };
  return appAxios.post(apiBase(`/private-api/drafts-update`), data).then((resp) => resp.data);
};

export const deleteDraft = (username: string, draftId: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: draftId };
  return appAxios.post(apiBase(`/private-api/drafts-delete`), data).then((resp) => resp.data);
};

export const getSchedules = (username: string): Promise<Schedule[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/schedules`), data).then((resp) => resp.data);
};

export const addSchedule = (
  username: string,
  permlink: string,
  title: string,
  body: string,
  meta: MetaData,
  options: CommentOptions | null,
  schedule: string,
  reblog: boolean
): Promise<any> => {
  const data: any = {
    code: getAccessToken(username),
    permlink,
    title,
    body,
    meta,
    schedule,
    reblog
  };

  if (options) {
    data.options = options;
  }

  return appAxios.post(apiBase(`/private-api/schedules-add`), data).then((resp) => resp.data);
};

export const deleteSchedule = (username: string, id: string): Promise<any> => {
  const data = { code: getAccessToken(username), id };
  return appAxios.post(apiBase(`/private-api/schedules-delete`), data).then((resp) => resp.data);
};

export const moveSchedule = (username: string, id: string): Promise<Schedule[]> => {
  const data = { code: getAccessToken(username), id };
  return appAxios.post(apiBase(`/private-api/schedules-move`), data).then((resp) => resp.data);
};

export const getBookmarks = (username: string): Promise<Bookmark[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/bookmarks`), data).then((resp) => resp.data);
};

export const addBookmark = (
  username: string,
  author: string,
  permlink: string
): Promise<{ bookmarks: Bookmark[] }> => {
  const data = { code: getAccessToken(username), author, permlink };
  return appAxios.post(apiBase(`/private-api/bookmarks-add`), data).then((resp) => resp.data);
};

export const deleteBookmark = (username: string, bookmarkId: string): Promise<any> => {
  const data = { code: getAccessToken(username), id: bookmarkId };
  return appAxios.post(apiBase(`/private-api/bookmarks-delete`), data).then((resp) => resp.data);
};

export const getFragments = (username: string): Promise<Fragment[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/fragments`), data).then((resp) => resp.data);
};

export const addFragment = (
  username: string,
  title: string,
  body: string
): Promise<{ fragments: Fragment[] }> => {
  const data = { code: getAccessToken(username), title, body };
  return appAxios.post(apiBase(`/private-api/fragments-add`), data).then((resp) => resp.data);
};

export const updateFragment = (
  username: string,
  fragmentId: string,
  title: string,
  body: string
): Promise<Fragment[]> => {
  const data = { code: getAccessToken(username), id: fragmentId, title, body };
  return appAxios.post(apiBase(`/private-api/fragments-update`), data).then((resp) => resp.data);
};

export const deleteFragment = (username: string, fragmentId: string): Promise<Fragment[]> => {
  const data = { code: getAccessToken(username), id: fragmentId };
  return appAxios.post(apiBase(`/private-api/fragments-delete`), data).then((resp) => resp.data);
};

export const getPointTransactions = (
  username: string,
  type?: number
): Promise<PointTransaction[]> => {
  if (EcencyConfigManager.CONFIG.visionFeatures.points.enabled) {
    const data = { username, type };
    return appAxios.post(apiBase(`/private-api/point-list`), data).then((resp) => resp.data);
  }

  return new Promise((resolve) => {
    resolve([]);
  });
};

export const claimPoints = (username: string): Promise<any> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/points-claim`), data).then((resp) => resp.data);
};

export const getPromotedPost = (
  username: string,
  author: string,
  permlink: string
): Promise<{ author: string; permlink: string } | ""> => {
  const data = { code: getAccessToken(username), author, permlink };
  return appAxios.post(apiBase(`/private-api/promoted-post`), data).then((resp) => resp.data);
};

export const commentHistory = (
  author: string,
  permlink: string,
  onlyMeta: boolean = false
): Promise<CommentHistory> => {
  const data = { author, permlink, onlyMeta: onlyMeta ? "1" : "" };
  return appAxios.post(apiBase(`/private-api/comment-history`), data).then((resp) => resp.data);
};

export const saveNotificationsSettings = (
  username: string,
  notifyTypes: NotifyTypes[],
  isEnabled: boolean,
  token: string
) => {
  return saveNotificationSetting(
    username,
    "web",
    Number(isEnabled),
    notifyTypes as number[],
    token
  );
};

export const getAnnouncementsData = async (): Promise<Announcement[]> => {
  try {
    const res = await appAxios.get<Announcement[]>(apiBase(`/private-api/announcements`));
    if (!res.data) {
      return [];
    }
    return res.data;
  } catch (error) {
    console.warn(error);
    throw error;
  }
};

export const getRecoveries = (username: string): Promise<GetRecoveriesEmailResponse[]> => {
  const data = { code: getAccessToken(username) };
  return appAxios.post(apiBase(`/private-api/recoveries`), data).then((resp) => resp.data);
};

export const addRecoveries = (
  username: string,
  email: string,
  publicKeys: Object
): Promise<{ recoveries: Recoveries }> => {
  const data = { code: getAccessToken(username), email, publicKeys };
  return appAxios.post(apiBase(`/private-api/recoveries-add`), data).then((resp) => resp.data);
};

export const onboardEmail = (username: string, email: string, friend: string): Promise<any> => {
  const dataBody = {
    username,
    email,
    friend
  };
  return appAxios
    .post(apiBase(`/private-api/account-create-friend`), dataBody)
    .then((resp) => resp.data);
};
