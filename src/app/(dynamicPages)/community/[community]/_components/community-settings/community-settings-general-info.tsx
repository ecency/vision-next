import { FormControl } from "@/features/ui";
import i18next from "i18next";
import { useFormContext } from "react-hook-form";

const langOpts = [
  { id: "af", name: "Afrikaans" },
  { id: "sq", name: "Albanian" },
  { id: "am", name: "Amharic" },
  { id: "ar", name: "Arabic" },
  { id: "hy", name: "Armenian" },
  { id: "az", name: "Azerbaijani" },
  { id: "eu", name: "Basque" },
  { id: "be", name: "Belarusian" },
  { id: "bn", name: "Bengali" },
  { id: "bs", name: "Bosnian" },
  { id: "bg", name: "Bulgarian" },
  { id: "my", name: "Burmese" },
  { id: "ca", name: "Catalan" },
  { id: "ny", name: "Chewa" },
  { id: "zh", name: "Chinese" },
  { id: "co", name: "Corsican" },
  { id: "hr", name: "Croatian" },
  { id: "cs", name: "Czech" },
  { id: "da", name: "Danish" },
  { id: "nl", name: "Dutch" },
  { id: "en", name: "English" },
  { id: "eo", name: "Esperanto" },
  { id: "et", name: "Estonian" },
  { id: "fi", name: "Finnish" },
  { id: "fr", name: "French" },
  { id: "gl", name: "Galician" },
  { id: "ka", name: "Georgian" },
  { id: "de", name: "German" },
  { id: "el", name: "Greek" },
  { id: "gu", name: "Gujarati" },
  { id: "ht", name: "Haitian Creole" },
  { id: "ha", name: "Hausa" },
  { id: "he", name: "Hebrew" },
  { id: "hi", name: "Hindi" },
  { id: "hu", name: "Hungarian" },
  { id: "is", name: "Icelandic" },
  { id: "ig", name: "Igbo" },
  { id: "id", name: "Indonesian" },
  { id: "ga", name: "Irish" },
  { id: "it", name: "Italian" },
  { id: "ja", name: "Japanese" },
  { id: "jv", name: "Javanese" },
  { id: "kn", name: "Kannada" },
  { id: "kk", name: "Kazakh" },
  { id: "rw", name: "Kinyarwanda" },
  { id: "ko", name: "Korean" },
  { id: "ku", name: "Kurdish" },
  { id: "ky", name: "Kyrgyz" },
  { id: "lo", name: "Lao" },
  { id: "la", name: "Latin" },
  { id: "lv", name: "Latvian" },
  { id: "lt", name: "Lithuanian" },
  { id: "lb", name: "Luxembourgish" },
  { id: "mk", name: "Macedonian" },
  { id: "mg", name: "Malagasy" },
  { id: "ms", name: "Malay" },
  { id: "ml", name: "Malayalam" },
  { id: "mt", name: "Maltese" },
  { id: "mi", name: "Maori" },
  { id: "mr", name: "Marathi" },
  { id: "mn", name: "Mongolian" },
  { id: "ne", name: "Nepali" },
  { id: "nb", name: "Norwegian (Bokmål)" },
  { id: "ps", name: "Pashto" },
  { id: "fa", name: "Persian" },
  { id: "pl", name: "Polish" },
  { id: "pt", name: "Portuguese" },
  { id: "pa", name: "Punjabi (Gurmukhi)" },
  { id: "ro", name: "Romanian" },
  { id: "ru", name: "Russian" },
  { id: "sm", name: "Samoan" },
  { id: "sr", name: "Serbian" },
  { id: "sn", name: "Shona" },
  { id: "sd", name: "Sindhi" },
  { id: "si", name: "Sinhala" },
  { id: "sk", name: "Slovak" },
  { id: "sl", name: "Slovenian" },
  { id: "so", name: "Somali" },
  { id: "es", name: "Spanish" },
  { id: "su", name: "Sundanese" },
  { id: "sw", name: "Swahili" },
  { id: "sv", name: "Swedish" },
  { id: "tg", name: "Tajik" },
  { id: "ta", name: "Tamil" },
  { id: "tt", name: "Tatar" },
  { id: "te", name: "Telugu" },
  { id: "th", name: "Thai" },
  { id: "tr", name: "Turkish" },
  { id: "tk", name: "Turkmen" },
  { id: "uk", name: "Ukrainian" },
  { id: "ur", name: "Urdu" },
  { id: "ug", name: "Uyghur" },
  { id: "uz", name: "Uzbek" },
  { id: "vi", name: "Vietnamese" },
  { id: "cy", name: "Welsh" },
  { id: "xh", name: "Xhosa" },
  { id: "yi", name: "Yiddish" },
  { id: "yo", name: "Yoruba" },
  { id: "zu", name: "Zulu" }
];

export function CommunitySettingsGeneralInfo() {
  const {
    register,
    formState: { errors }
  } = useFormContext();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-2 md:px-4">
      <div>
        <div className="text-sm font-semibold px-3 mb-2">
          {i18next.t("community-settings.title")}
        </div>

        <FormControl
          {...register("title")}
          type="text"
          autoComplete="off"
          aria-invalid={!!errors.title}
        />
        <div className="text-red text-sm px-3">{errors.title?.message?.toString()}</div>
      </div>
      <div>
        <div className="text-sm font-semibold px-3 mb-2">
          {i18next.t("community-settings.about")}
        </div>

        <FormControl
          {...register("about")}
          type="text"
          autoComplete="off"
          aria-invalid={!!errors.about}
        />
        <div className="text-red text-sm px-3">{errors.about?.message?.toString()}</div>
      </div>
      <div>
        <div className="text-sm font-semibold px-3 mb-2">
          {i18next.t("community-settings.lang")}
        </div>

        <FormControl {...register("lang")} type="select" aria-invalid={!!errors.lang}>
          {langOpts.map((l, k) => (
            <option key={k} value={l.id}>
              {l.name}
            </option>
          ))}
        </FormControl>
      </div>
    </div>
  );
}
