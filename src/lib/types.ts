export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
};

export type Calendar = {
  id: string;
  name: string;
  ownerId: string;
  color: string;
};

export type Event = {
  id: string;
  calendarId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  participants: string[];
};
