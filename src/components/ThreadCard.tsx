import Link from "next/link";
import { Thread } from "@/lib/types";
import { formatDistanceToNow } from "date-fns";
import { hu } from "date-fns/locale";

export default function ThreadCard({ thread }: { thread: Thread }) {
  const lastActivity = thread.lastReplyAt
    ? formatDistanceToNow(thread.lastReplyAt.toDate(), { addSuffix: true, locale: hu })
    : "";

  return (
    <div className="flex items-start gap-4 p-4 hover:bg-blade-cream transition-colors">
      {/* Avatar placeholder */}
      <div className="shrink-0 w-9 h-9 rounded-full bg-blade-dark flex items-center justify-center text-white text-sm font-bold">
        {thread.authorName?.[0]?.toUpperCase() ?? "?"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          {thread.isPinned && (
            <span className="text-xs bg-blade-red text-white px-1.5 py-0.5 rounded font-semibold">
              KITŰZÖTT
            </span>
          )}
          {thread.isLocked && (
            <span className="text-xs bg-gray-400 text-white px-1.5 py-0.5 rounded font-semibold">
              LEZÁRT
            </span>
          )}
          <span className="text-xs text-blade-steel bg-blade-cream-dark px-1.5 py-0.5 rounded">
            {thread.categoryName}
          </span>
        </div>

        <Link
          href={`/forum/${thread.id}`}
          className="font-semibold text-blade-dark hover:text-blade-red transition-colors text-sm leading-snug block"
        >
          {thread.title}
        </Link>

        {thread.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {thread.tags.map((tag) => (
              <span key={tag} className="text-xs text-blade-steel">
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-400 mt-1">
          <span className="font-medium text-gray-600">{thread.authorName}</span>
          {" · "}
          {lastActivity}
        </div>
      </div>

      {/* Stats */}
      <div className="shrink-0 text-right hidden sm:block">
        <div className="text-sm font-semibold text-blade-dark">
          {thread.replyCount}
        </div>
        <div className="text-xs text-gray-400">válasz</div>
        <div className="text-xs text-gray-300 mt-1">{thread.viewCount} megtekintés</div>
      </div>
    </div>
  );
}
