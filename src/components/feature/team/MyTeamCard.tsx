"use client";

import { useState } from "react";

interface Member {
  id: string | number;
  image: string;
  name?: string;
}

export interface MyTeam {
  teamCode: string;
  title: string;
  description: string;
  teamType: "hackathon" | "open";
  status: "recruiting" | "closed";
  members: Member[];
  maxMembers: number;
  positions: string[];
  contactUrl?: string;
}

function DeleteModal({
  teamName,
  onConfirm,
  onClose,
}: {
  teamName: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-xl">⚠️</span>
          <h2 className="text-base font-bold text-gray-800">팀 삭제</h2>
        </div>
        <p className="mb-1 text-sm text-gray-700">
          <span className="font-semibold">"{teamName}"</span> 팀을 삭제할까요?
        </p>
        <p className="mb-6 text-xs text-gray-400">삭제 후에는 복구할 수 없어요.</p>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors"
          >
            삭제하기
          </button>
        </div>
      </div>
    </div>
  );
}

function EditModal({
  team,
  onSave,
  onClose,
}: {
  team: MyTeam;
  onSave: (updated: Partial<MyTeam>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(team.title);
  const [description, setDescription] = useState(team.description);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">팀 정보 수정</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">팀명</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500">팀 소개</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border-2 border-gray-200 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={() => { onSave({ title, description }); onClose(); }}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-400 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}

export function MyTeamCard({
  team,
  onUpdate,
  onDelete,
}: {
  team: MyTeam;
  onUpdate: (updated: Partial<MyTeam>) => void;
  onDelete: () => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const isRecruiting = team.status === "recruiting";
  const fillPercent = team.maxMembers > 0
    ? Math.min((team.members.length / team.maxMembers) * 100, 100)
    : 0;

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">

          {/* 상단: 팀 정보 + 모집 토글 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{team.teamType === "hackathon" ? "🏆" : "🔓"}</span>
                <span className={`text-xs font-semibold ${team.teamType === "hackathon" ? "text-blue-600" : "text-amber-600"}`}>
                  {team.teamType === "hackathon" ? "해커톤팀" : "오픈팀"}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{team.title}</h3>
              <p className="text-sm text-gray-500">{team.description}</p>
            </div>

            {/* 모집 여부 토글 */}
            <div className="flex shrink-0 items-center gap-2">
              <span className={`text-xs font-semibold ${isRecruiting ? "text-green-600" : "text-gray-400"}`}>
                {isRecruiting ? "모집 중" : "모집 마감"}
              </span>
              <input
                type="checkbox"
                id={`toggle-${team.teamCode}`}
                checked={isRecruiting}
                onChange={() => onUpdate({ status: isRecruiting ? "closed" : "recruiting" })}
                className="hidden"
              />
              <label
                htmlFor={`toggle-${team.teamCode}`}
                className={`relative block h-6 w-11 cursor-pointer rounded-full transition-colors duration-300 ${
                  isRecruiting ? "bg-green-400" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] block h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ${
                    isRecruiting ? "translate-x-[20px]" : "translate-x-0"
                  }`}
                />
              </label>
            </div>
          </div>

          {/* 포지션 태그 */}
          {team.positions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {team.positions.map((pos) => (
                <span
                  key={pos}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                >
                  {pos}
                </span>
              ))}
            </div>
          )}

          {/* 참여 인원 바 */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {/* 멤버 아바타 */}
                <div className="flex items-center">
                  {team.members.slice(0, 6).map((m, i) => (
                    <div
                      key={m.id}
                      className={`group relative flex h-7 w-7 cursor-pointer items-center justify-center overflow-visible rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-green-400 text-[10px] font-bold text-white ${i !== 0 ? "-ml-2" : ""}`}
                    >
                      <span className="z-10">{(m.name ?? "?")[0]}</span>
                      {m.name && (
                        <div className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-800 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                          {m.name}
                          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{team.members.length}명 참여 중</span>
              </div>
              <span className="text-xs font-bold text-gray-600">
                {team.members.length} / {team.maxMembers}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isRecruiting ? "bg-gradient-to-r from-blue-400 to-green-400" : "bg-gray-300"
                }`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          {/* 하단: 수정/삭제 */}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="flex items-center whitespace-nowrap gap-1.5 rounded-lg border border-gray-200 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              수정
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center whitespace-nowrap gap-1.5 rounded-lg border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteModal
          teamName={team.title}
          onConfirm={() => { onDelete(); setShowDeleteModal(false); }}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
      {showEditModal && (
        <EditModal
          team={team}
          onSave={onUpdate}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
