import i18next from "i18next";
import Link from "next/link";

interface Props {
  url: string;
}

export function CommunityCreateDone({ url }: Props) {
  return (
    <div className="done">
      <p>{i18next.t("communities-create.done")}</p>
      <p>
        <strong>
          <Link href={url}>{i18next.t("communities-create.done-link-label")}</Link>
        </strong>
      </p>
    </div>
  );
}
