export interface Announcement {
  id: number;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  // When present, the announcement is a Hive proposal-support prompt. The web client
  // lets the user approve the proposal inline (active authority) instead of only
  // linking to the proposal page. The server's `ops` (mobile signing URI) is not
  // consumed on web — we construct the vote operation client-side from these ids.
  proposal_ids?: number[];
}

export interface LaterAnnouncement {
  id: number;
  dateTime: Date;
}
