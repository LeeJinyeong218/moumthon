"use client";

import { useState } from "react";

interface Member {
  id: number;
  image: string;
}

interface TeamCardProps {
  teamCode: string;
  title: string;
  description: string;
  status: "recruiting" | "closed";
  members: Member[];
  maxMembers: number;
  teamType: "hackathon" | "open";
  positions: string[];
}

function MessageModal({
  teamName,
  onClose,
}: {
  teamName: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    alert("쪽지를 보냈습니다!");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        data-testid="camp-message-modal"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-800">쪽지 보내기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="mb-1 text-xs text-gray-400">받는 팀</p>
          <p className="text-sm font-medium text-gray-700">{teamName}</p>
        </div>

        <div className="mb-5">
          <p className="mb-1.5 text-xs text-gray-400">메시지</p>
          <textarea
            data-testid="camp-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="팀에게 보낼 메시지를 입력하세요."
            rows={4}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300"
          />
          <p className="mt-1 text-right text-xs text-gray-300">{message.length} / 300</p>
        </div>

        <div className="flex gap-2">
          <button
            data-testid="camp-message-cancel-btn"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            data-testid="camp-message-send-btn"
            onClick={handleSend}
            disabled={!message.trim()}
            className="flex-1 rounded-xl bg-gradient-to-r from-blue-500 to-green-400 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-40"
          >
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}

export function TeamCard({
  teamCode,
  title,
  description,
  status,
  members,
  maxMembers,
  teamType,
  positions,
}: TeamCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentCount = members.length;
  const fillPercent =
    maxMembers > 0 ? Math.min((currentCount / maxMembers) * 100, 100) : 0;

  return (
    <>
      <div data-testid={`camp-team-card-${teamCode}`} className="rounded-2xl border border-white/40 bg-white/60 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg">

        {/* 상단: 모집 여부 우측 정렬 */}
        <div className="mb-3 flex justify-end">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === "recruiting"
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {status === "recruiting" ? "모집 중" : "마감"}
          </span>
        </div>

        {/* 팀 유형 */}
        <div className="mb-1 flex items-center gap-1">
          <span className="text-sm">
            {teamType === "hackathon" ? "🏆" : "🔓"}
          </span>
          <span
            className={`text-xs font-medium ${
              teamType === "hackathon" ? "text-primary-600" : "text-amber-600"
            }`}
          >
            {teamType === "hackathon" ? "해커톤팀" : "오픈팀"}
          </span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>

        {/* 설명 */}
        <p className="mt-2 text-sm text-gray-500">{description}</p>

        {/* 모집 포지션 태그 */}
        {positions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {positions.map((pos) => (
              <span
                key={pos}
                className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {pos}
              </span>
            ))}
          </div>
        )}

        {/* 참여 인원 바 */}
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-xs text-gray-400">참여 인원</span>
            <span className="text-xs font-semibold text-gray-600">
              {currentCount} / {maxMembers}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
             className={`h-full rounded-full transition-all duration-500 ${
                        status === "closed"
                            ? "bg-gray-300"
                            : "bg-gradient-to-r from-blue-400 to-green-400"
                        }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        </div>

        {/* 쪽지보내기 버튼 */}
        <div className="mt-4 border-t border-gray-100 pt-4">
          <button
            data-testid={`camp-team-message-btn-${teamCode}`}
            onClick={() => setIsModalOpen(true)}
            disabled={status === "closed"}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-blue-50 py-2 text-sm font-medium text-blue-500 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-300"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75"
              />
            </svg>
            쪽지보내기
          </button>
        </div>
      </div>

      {isModalOpen && (
        <MessageModal
          teamName={title}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
}
