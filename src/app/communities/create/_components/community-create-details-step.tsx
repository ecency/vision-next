import { LoginRequired } from "@/features/shared";
import { Button, FormControl } from "@/features/ui";
import { handleInvalid } from "@/utils";
import i18next from "i18next";
import { CommunityCreateCardLayout } from "./community-create-card-layout";

interface Props {
  title: string;
  setTitle: (title: string) => void;
  about: string;
  setAbout: (about: string) => void;
  onContinue: () => void;
}

export function CommunityCreateDetailsStep({
  title,
  setTitle,
  about,
  setAbout,
  onContinue
}: Props) {
  return (
    <CommunityCreateCardLayout>
      <FormControl
        type="text"
        autoComplete="off"
        autoFocus={true}
        value={title}
        minLength={3}
        maxLength={20}
        onChange={(e) => setTitle(e.target.value)}
        required={true}
        onInvalid={(e: any) => handleInvalid(e, "communities-create.", "title-validation")}
        onInput={(e: any) => e.target.setCustomValidity("")}
        name="title"
        aria-invalid={title.length <= 2 || title.length >= 21}
        placeholder={i18next.t("communities-create.title")}
      />

      <FormControl
        type="text"
        autoComplete="off"
        value={about}
        maxLength={120}
        onChange={(e) => setAbout(e.target.value)}
        name="about"
        placeholder={i18next.t("communities-create.about")}
      />

      <div className="flex justify-end">
        <LoginRequired>
          <Button disabled={!title} onClick={() => !!title && onContinue()}>
            {i18next.t("g.continue")}
          </Button>
        </LoginRequired>
      </div>
    </CommunityCreateCardLayout>
  );
}
