import { useEffect, useRef } from "react";
import { useAuthStore } from "@/app/store/authStore";
import { useRecordPostViewMutation } from "@/features/posts/api/postsApi";

export function usePostViewTracker(
  groupId: string,
  postId: string,
  authorId: string,
) {
  const ref = useRef<HTMLElement | null>(null);
  const hasFired = useRef(false);
  const currentUser = useAuthStore((state) => state.user);
  const [recordView] = useRecordPostViewMutation();

  useEffect(() => {
    if (hasFired.current || !ref.current) return;
    if (currentUser?.id === authorId) return;

    const element = ref.current;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            if (!hasFired.current) {
              hasFired.current = true;
              recordView({ groupId, postId });
              observer.disconnect();
            }
          }, 1000);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [groupId, postId, authorId, currentUser?.id, recordView]);

  return ref;
}
