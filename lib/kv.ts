import { createClient } from "@vercel/kv";

const kv = createClient({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const KEY = "teacher-rank-data";

export type ImageItem = {
  id: string;
  data: string;
  likes: number;
  likedBy: string[];
  createdBy: string;
  createdAt: number;
};

export type BioItem = {
  id: string;
  text: string;
  likes: number;
  likedBy: string[];
  createdBy: string;
  createdAt: number;
};

export type Teacher = {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  ratings: Record<string, number>;
  images: ImageItem[];
  bios: BioItem[];
  takedownRequests: string[];
  hiddenBy: string[];
};

type Data = { teachers: Teacher[] };

export async function getData(): Promise<Data> {
  const data = await kv.get<Data>(KEY);
  return data || { teachers: [] };
}

export async function setData(data: Data) {
  await kv.set(KEY, data);
}

export async function addTeacher(teacher: Teacher) {
  const data = await getData();
  if (data.teachers.find((t) => t.name === teacher.name)) {
    throw new Error("该人物已存在");
  }
  data.teachers.push(teacher);
  await setData(data);
  return teacher;
}

export async function deleteTeacher(id: string, userId: string) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) throw new Error("人物不存在");
  if (teacher.createdBy === userId) {
    data.teachers = data.teachers.filter((t) => t.id !== id);
  } else if (!teacher.hiddenBy.includes(userId)) {
    teacher.hiddenBy.push(userId);
  }
  await setData(data);
}

export async function rateTeacher(id: string, userId: string, rating: number) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) throw new Error("人物不存在");
  teacher.ratings[userId] = rating;
  await setData(data);
}

function pruneItems<T extends { likes: number; createdAt: number }>(
  items: T[],
  max: number
) {
  items.sort((a, b) => b.likes - a.likes || b.createdAt - a.createdAt);
  return items.slice(0, max);
}

export async function addImage(id: string, image: ImageItem) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) throw new Error("人物不存在");
  teacher.images.push(image);
  teacher.images = pruneItems(teacher.images, 10);
  await setData(data);
}

export async function addBio(id: string, bio: BioItem) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) throw new Error("人物不存在");
  teacher.bios.push(bio);
  teacher.bios = pruneItems(teacher.bios, 10);
  await setData(data);
}

export async function likeImage(
  teacherId: string,
  imageId: string,
  userId: string
) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === teacherId);
  if (!teacher) throw new Error("人物不存在");
  const image = teacher.images.find((i) => i.id === imageId);
  if (!image) throw new Error("图片不存在");
  if (image.likedBy.includes(userId)) {
    image.likedBy = image.likedBy.filter((id) => id !== userId);
    image.likes--;
  } else {
    image.likedBy.push(userId);
    image.likes++;
  }
  await setData(data);
}

export async function likeBio(
  teacherId: string,
  bioId: string,
  userId: string
) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === teacherId);
  if (!teacher) throw new Error("人物不存在");
  const bio = teacher.bios.find((b) => b.id === bioId);
  if (!bio) throw new Error("简介不存在");
  if (bio.likedBy.includes(userId)) {
    bio.likedBy = bio.likedBy.filter((id) => id !== userId);
    bio.likes--;
  } else {
    bio.likedBy.push(userId);
    bio.likes++;
  }
  await setData(data);
}

export async function requestTakedown(id: string, userId: string) {
  const data = await getData();
  const teacher = data.teachers.find((t) => t.id === id);
  if (!teacher) throw new Error("人物不存在");
  if (!teacher.takedownRequests.includes(userId)) {
    teacher.takedownRequests.push(userId);
  }
  if (teacher.takedownRequests.length >= 10) {
    data.teachers = data.teachers.filter((t) => t.id !== id);
  }
  await setData(data);
}
