import { NextRequest, NextResponse } from "next/server";
import {
  getData,
 addTeacher,
  deleteTeacher,
  rateTeacher,
  addImage,
  addBio,
  likeImage,
  likeBio,
  requestTakedown,
} from "@/lib/kv";

export async function GET() {
  const data = await getData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...payload } = body;

  try {
    switch (action) {
      case "addTeacher":
        return NextResponse.json(await addTeacher(payload.teacher));
      case "deleteTeacher":
        await deleteTeacher(payload.id, payload.userId);
        return NextResponse.json({ success: true });
      case "rate":
        await rateTeacher(payload.id, payload.userId, payload.rating);
        return NextResponse.json({ success: true });
      case "addImage":
        await addImage(payload.id, payload.image);
        return NextResponse.json({ success: true });
      case "addBio":
        await addBio(payload.id, payload.bio);
        return NextResponse.json({ success: true });
      case "likeImage":
        await likeImage(payload.teacherId, payload.imageId, payload.userId);
        return NextResponse.json({ success: true });
      case "likeBio":
        await likeBio(payload.teacherId, payload.bioId, payload.userId);
        return NextResponse.json({ success: true });
      case "takedown":
        await requestTakedown(payload.id, payload.userId);
        return NextResponse.json({ success: true });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
