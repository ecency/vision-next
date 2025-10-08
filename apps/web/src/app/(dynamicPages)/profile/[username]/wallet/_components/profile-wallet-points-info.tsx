import { StyledTooltip } from "@/features/ui";
import {
  UilArrowCircleUp,
  UilCheckCircle,
  UilCommentAdd,
  UilMoneyInsert,
  UilPen,
  UilPlusCircle,
  UilRepeat,
  UilStar,
  UilUser
} from "@tooni/iconscout-unicons-react";
import i18next from "i18next";

const list = [
  {
    icon: <UilPlusCircle className="w-4 h-4" />,
    tooltip: i18next.t("points.referral-desc"),
    value: "99+"
  },
  {
    icon: <UilMoneyInsert className="w-4 h-4" />,
    tooltip: i18next.t("points.delegation-desc"),
    value: 10
  },
  {
    icon: <UilPen className="w-4 h-4" />,
    tooltip: i18next.t("points.post-desc"),
    value: 15
  },
  {
    icon: <UilCommentAdd className="w-4 h-4" />,
    tooltip: i18next.t("points.comment-desc"),
    value: 5
  },
  {
    icon: <UilArrowCircleUp className="w-4 h-4" />,
    tooltip: i18next.t("points.vote-desc"),
    value: 0.3
  },
  {
    icon: <UilRepeat className="w-4 h-4" />,
    tooltip: i18next.t("points.reblog-desc"),
    value: 1
  },
  {
    icon: <UilStar className="w-4 h-4" />,
    tooltip: i18next.t("points.checkin-desc"),
    value: 0.25
  },
  {
    icon: <UilUser className="w-4 h-4" />,
    tooltip: i18next.t("points.login-desc"),
    value: 10
  },
  {
    icon: <UilCheckCircle className="w-4 h-4" />,
    tooltip: i18next.t("points.checkin-extra-desc"),
    value: 10
  }
];

export function ProfileWalletPointsInfo() {
  return (
    <div className="flex gap-2 flex-wrap">
      {list.map(({ icon, tooltip, value }, i) => (
        <StyledTooltip key={i} content={tooltip}>
          <div className="flex flex-col rounded-lg overflow-hidden">
            <span className="bg-blue-duck-egg dark:bg-blue-dark-grey flex items-center justify-center w-8 h-8">
              {icon}
            </span>
            <span className="border-x border-b border-blue-duck-egg dark:border-blue-dark-grey rounded-b-lg text-xs text-center py-0.5">
              {value}
            </span>
          </div>
        </StyledTooltip>
      ))}
    </div>
  );
}
