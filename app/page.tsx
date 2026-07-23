"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [userId, setUserId] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"rate" | "images" | "bios">("rate");
  const [loading, setLoading] = useState(false);

  const [newName, setNewName] = useState("");
  const [newBio, setNewBio] = useState("");
  const [newImage, setNewImage] = useState("");
  const [newDetailImage, setNewDetailImage] = useState("");
  const [newDetailBio, setNewDetailBio] = useState("");

  const TIERS = [
    { key: "夯", color: "bg-[#c53e2c]", text: "text-white" },
    { key: "顶级", color: "bg-[#d4893a]", text: "text-white" },
    { key: "人上人", color: "bg-[#c4a43b]", text: "text-white" },
    { key: "NPC", color: "bg-[#7a8a6e]", text: "text-white" },
    { key: "拉", color: "bg-[#5a6a8a]", text: "text-white" },
  ];

  const RATING_MAP: Record<string, number> = {
    拉: 1,
    NPC: 2,
    人上人: 3,
    顶级: 4,
    夯: 5,
  };

  useEffect(() => {
    let uid = localStorage.getItem("teacher-rank-user-id");
    if (!uid) {
      uid =
        Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem("teacher-rank-user-id", uid);
    }
    setUserId(uid);

    if (!localStorage.getItem("teacher-rank-visited")) {
      setShowWelcome(true);
      localStorage.setItem("teacher-rank-visited", "true");
    }

    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const res = await fetch("/api/teachers");
    const data = await res.json();
    const list = data.teachers || [];
    setTeachers(list);
    setSelectedTeacher((prev: any) => {
      if (!prev) return null;
      const found = list.find((t: any) => t.id === prev.id);
      return found || null;
    });
  };

  const getAvg = (t: any) => {
    const vals = Object.values(t.ratings || {});
    if (!vals.length) return null;
    return Math.round(vals.reduce((a: any, b: any) => a + b, 0) / vals.length);
  };

  const getTier = (avg: number) =>
    Object.entries(RATING_MAP).find(([_, v]) => v === avg)?.[0] || null;

  const visibleTeachers = teachers.filter((t) => !t.hiddenBy?.includes(userId));

  const tierTeachers = (key: string) =>
    visibleTeachers.filter((t) => {
      const avg = getAvg(t);
      return avg !== null && getTier(avg) === key;
    });

  const unratedTeachers = visibleTeachers.filter((t) => getAvg(t) === null);

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert("照片大小不能大于1MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setter((ev.target?.result as string) || "");
    reader.readAsDataURL(file);
  };

  const handleAddTeacher = async () => {
    if (!newName.trim() || !newBio.trim()) {
      alert("姓名和简介必须填写");
      return;
    }
    if (newBio.length > 200) {
      alert("简介不能多于200字");
      return;
    }
    const teacher = {
      id: Math.random().toString(36).substring(2),
      name: newName.trim(),
      createdBy: userId,
      createdAt: Date.now(),
      ratings: {},
      images: newImage
        ? [
            {
              id: Math.random().toString(36).substring(2),
              data: newImage,
              likes: 0,
              likedBy: [],
              createdBy: userId,
              createdAt: Date.now(),
            },
          ]
        : [],
      bios: [
        {
          id: Math.random().toString(36).substring(2),
          text: newBio.trim(),
          likes: 0,
          likedBy: [],
          createdBy: userId,
          createdAt: Date.now(),
        },
      ],
      takedownRequests: [],
      hiddenBy: [],
    };
    setLoading(true);
    const res = await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addTeacher", teacher }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) {
      alert(data.error);
      return;
    }
    setNewName("");
    setNewBio("");
    setNewImage("");
    setShowAddModal(false);
    fetchTeachers();
  };

  const handleRate = async (id: string, rating: number) => {
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rate", id, userId, rating }),
    });
    fetchTeachers();
    setSelectedTeacher(null);
  };

  const handleDelete = async (t: any) => {
    if (!confirm("确定要删除吗？")) return;
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteTeacher", id: t.id, userId }),
    });
    fetchTeachers();
    setSelectedTeacher(null);
  };

  const handleTakedown = async (id: string) => {
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "takedown", id, userId }),
    });
    fetchTeachers();
    setSelectedTeacher(null);
  };

  const handleAddDetailImage = async () => {
    if (!newDetailImage || !selectedTeacher) return;
    const image = {
      id: Math.random().toString(36).substring(2),
      data: newDetailImage,
      likes: 0,
      likedBy: [],
      createdBy: userId,
      createdAt: Date.now(),
    };
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addImage",
        id: selectedTeacher.id,
        image,
      }),
    });
    setNewDetailImage("");
    fetchTeachers();
  };

  const handleAddDetailBio = async () => {
    if (!newDetailBio.trim() || !selectedTeacher) return;
    if (newDetailBio.length > 200) {
      alert("简介不能多于200字");
      return;
    }
    const bio = {
      id: Math.random().toString(36).substring(2),
      text: newDetailBio.trim(),
      likes: 0,
      likedBy: [],
      createdBy: userId,
      createdAt: Date.now(),
    };
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "addBio",
        id: selectedTeacher.id,
        bio,
      }),
    });
    setNewDetailBio("");
    fetchTeachers();
  };

  const handleLikeImage = async (imageId: string) => {
    if (!selectedTeacher) return;
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "likeImage",
        teacherId: selectedTeacher.id,
        imageId,
        userId,
      }),
    });
    fetchTeachers();
  };

  const handleLikeBio = async (bioId: string) => {
    if (!selectedTeacher) return;
    await fetch("/api/teachers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "likeBio",
        teacherId: selectedTeacher.id,
        bioId,
        userId,
      }),
    });
    fetchTeachers();
  };

  const topImage = (t: any) =>
    t.images?.length
      ? t.images.reduce((a: any, b: any) => (a.likes > b.likes ? a : b))
      : null;

  const topBio = (t: any) =>
    t.bios?.length
      ? t.bios.reduce((a: any, b: any) => (a.likes > b.likes ? a : b))
      : null;

  const renderCard = (t: any) => {
    const img = topImage(t);
    return (
      <div
        key={t.id}
        onClick={() => {
          setSelectedTeacher(t);
          setDetailTab("rate");
        }}
        className="inline-flex flex-col items-center cursor-pointer mx-2 my-2 w-24"
      >
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center border border-gray-300">
          {img ? (
            <img
              src={img.data}
              alt={t.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-600 text-center px-1">
              {t.name}
            </span>
          )}
        </div>
        <span className="text-xs mt-1 text-gray-700">{t.name}</span>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {showWelcome && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowWelcome(false)}
        >
          <div
            className="bg-[#f5f0e8] rounded-lg p-8 max-w-md mx-4 shadow-xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-gray-800 leading-relaxed text-center">
              本网站用于你对该学校老师进行评价，你可以上传，添加新的人物，可以为所有的人物进行评价或撰写评语，为别人的评语点赞。请注意文明用语。
            </p>
            <button
              onClick={() => setShowWelcome(false)}
              className="mt-6 w-full bg-gray-800 text-white py-2 rounded hover:bg-gray-700"
            >
              我知道了
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center text-gray-800 mb-10 tracking-wider">
        从夯到拉锐评25中所有老师
      </h1>

      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200">
        {TIERS.map((tier) => (
          <div
            key={tier.key}
            className="flex border-b border-gray-200 last:border-b-0"
          >
            <div
              className={`${tier.color} ${tier.text} w-20 flex items-center justify-center text-lg font-bold py-6 flex-shrink-0`}
            >
              {tier.key}
            </div>
            <div className="flex-1 bg-[#faf6f0] min-h-[80px] p-3 flex flex-wrap items-center">
              {tierTeachers(tier.key).length === 0 ? (
                <span className="text-gray-400 text-sm ml-2">暂无人物</span>
              ) : (
                tierTeachers(tier.key).map(renderCard)
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-8">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#2d2d2d] text-white px-8 py-3 rounded flex items-center gap-2 hover:bg-[#1d1d1d] transition-colors"
        >
          <span className="text-xl">+</span> 添加人物
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-center text-gray-500 text-sm mb-4">待分档</h3>
        <div className="flex flex-wrap justify-center">
          {unratedTeachers.length === 0 ? (
            <span className="text-gray-400 text-sm">暂无待分档人物</span>
          ) : (
            unratedTeachers.map(renderCard)
          )}
        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="bg-[#f5f0e8] rounded-lg p-6 max-w-md w-full mx-4 shadow-xl border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              添加人物
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="请填写人物的真实姓名"
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  照片
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, setNewImage)}
                  className="w-full text-sm text-gray-600"
                />
                <p className="text-xs text-gray-400 mt-1">
                  请添加与人物有关的照片，照片大小不能大于1MB
                </p>
                {newImage && (
                  <img
                    src={newImage}
                    className="mt-2 w-20 h-20 object-cover rounded border border-gray-200"
                  />
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  简介 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newBio}
                  onChange={(e) => setNewBio(e.target.value)}
                  placeholder="请撰写一段简介"
                  rows={4}
                  maxLength={200}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-gray-500 resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {newBio.length}/200
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 border border-gray-300 py-2 rounded text-gray-600 hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={handleAddTeacher}
                disabled={loading}
                className="flex-1 bg-[#2d2d2d] text-white py-2 rounded hover:bg-[#1d1d1d] disabled:opacity-50"
              >
                {loading ? "添加中..." : "确定"}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTeacher && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setSelectedTeacher(null)}
        >
          <div
            className="bg-[#f5f0e8] rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl border border-gray-300 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedTeacher.name}
              </h2>
              <button
                onClick={() => setSelectedTeacher(null)}
                className="text-gray-500 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="mb-4 text-center">
              {(() => {
                const img = topImage(selectedTeacher);
                return img ? (
                  <img
                    src={img.data}
                    className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-lg mx-auto border border-gray-200 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-600">
                      {selectedTeacher.name}
                    </span>
                  </div>
                );
              })()}
              <p className="text-lg font-bold mt-2">
                {selectedTeacher.name}
              </p>
              {(() => {
                const bio = topBio(selectedTeacher);
                return bio ? (
                  <p className="text-sm text-gray-600 mt-1">{bio.text}</p>
                ) : null;
              })()}
            </div>

            <div className="flex border-b border-gray-300 mb-4">
              {(["rate", "images", "bios"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2 text-sm ${
                    detailTab === tab
                      ? "border-b-2 border-gray-800 text-gray-800 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {tab === "rate"
                    ? "评分"
                    : tab === "images"
                    ? "照片"
                    : "简介"}
                </button>
              ))}
            </div>

            {detailTab === "rate" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">请选择档位：</p>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier.key}
                      onClick={() =>
                        handleRate(selectedTeacher.id, RATING_MAP[tier.key])
                      }
                      className={`${tier.color} ${tier.text} px-4 py-2 rounded font-bold hover:opacity-90`}
                    >
                      {tier.key}
                    </button>
                  ))}
                </div>
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {selectedTeacher.createdBy === userId ? (
                    <button
                      onClick={() => handleDelete(selectedTeacher)}
                      className="w-full border border-red-300 text-red-600 py-2 rounded hover:bg-red-50"
                    >
                      删除人物
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDelete(selectedTeacher)}
                        className="w-full border border-gray-300 text-gray-600 py-2 rounded hover:bg-gray-100"
                      >
                        删除（仅自己不可见）
                      </button>
                      <button
                        onClick={() => handleTakedown(selectedTeacher.id)}
                        className="w-full border border-orange-300 text-orange-600 py-2 rounded hover:bg-orange-50"
                      >
                        申请下架 (
                        {selectedTeacher.takedownRequests?.length || 0}/10)
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {detailTab === "images" && (
              <div className="space-y-4">
                <div className="border border-gray-300 rounded p-3 bg-white">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageUpload(e, setNewDetailImage)
                    }
                    className="text-sm w-full"
                  />
                  {newDetailImage && (
                    <>
                      <img
                        src={newDetailImage}
                        className="mt-2 w-20 h-20 object-cover rounded border border-gray-200"
                      />
                      <button
                        onClick={handleAddDetailImage}
                        className="mt-2 w-full bg-[#2d2d2d] text-white py-1.5 rounded text-sm"
                      >
                        上传照片
                      </button>
                    </>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {selectedTeacher.images?.map((img: any) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.data}
                        className="w-full h-24 object-cover rounded border border-gray-200"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 flex justify-between items-center rounded-b">
                        <span>👍 {img.likes}</span>
                        <button
                          onClick={() => handleLikeImage(img.id)}
                          className="hover:text-yellow-300"
                        >
                          {img.likedBy?.includes(userId) ? "已赞" : "赞"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailTab === "bios" && (
              <div className="space-y-4">
                <div className="border border-gray-300 rounded p-3 bg-white">
                  <textarea
                    value={newDetailBio}
                    onChange={(e) => setNewDetailBio(e.target.value)}
                    placeholder="撰写新简介（最多200字）"
                    rows={3}
                    maxLength={200}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-sm resize-none focus:outline-none"
                  />
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400">
                      {newDetailBio.length}/200
                    </span>
                    <button
                      onClick={handleAddDetailBio}
                      className="bg-[#2d2d2d] text-white px-3 py-1 rounded text-sm"
                    >
                      添加简介
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {selectedTeacher.bios?.map((bio: any) => (
                    <div
                      key={bio.id}
                      className="border border-gray-200 rounded p-3 bg-white"
                    >
                      <p className="text-sm text-gray-700 mb-2">{bio.text}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>👍 {bio.likes}</span>
                        <button
                          onClick={() => handleLikeBio(bio.id)}
                          className={`px-2 py-1 rounded ${
                            bio.likedBy?.includes(userId)
                              ? "bg-yellow-100 text-yellow-700"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {bio.likedBy?.includes(userId) ? "已赞" : "点赞"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    <div className="text-center text-gray-400 text-xs mt-12 pb-4">由@icoico创作</div>
    </div>
  );
}
