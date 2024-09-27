import { FormControl } from "@ui/input";
import { handleInvalid } from "@/utils";
import i18next from "i18next";

interface Props {
  title: string;
  setTitle: (title: string) => void;
  about: string;
  setAbout: (about: string) => void;
}

export function CommunityCreateDetailsForm({ title, setTitle, about, setAbout }: Props) {
  return (
    <>
      <div className="mb-4">
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
      </div>
      <div className="mb-4">
        <FormControl
          type="text"
          autoComplete="off"
          value={about}
          maxLength={120}
          onChange={(e) => setAbout(e.target.value)}
          name="about"
          placeholder={i18next.t("communities-create.about")}
        />
      </div>
    </>
  );
}
