import axios from "axios";

const translationApi = axios.create({
  baseURL: "https://translate.ecency.com",
  headers: {
    "Content-Type": "application/json"
  }
});

interface TranslationResponse {
  translatedText: string;
}

interface LanguagesMap {
  [id: string]: {
    code: string;
    name: string;
    targets: string[];
  };
}

export interface Language {
  code: string;
  name: string;
  targets: string[];
}

export const getTranslation = async (
  text: string,
  source: string,
  target: string
): Promise<TranslationResponse> => {
  const { data } = await translationApi.post<TranslationResponse>("/translate", {
    q: text,
    source,
    target,
    format: "text",
    api_key: ""
  });
  return data;
};

export const getLanguages = async (): Promise<Language[]> => {
  const { data } = await translationApi.get<LanguagesMap>("/languages");
  return Object.values(data).map(({ code, name, targets }) => ({
    code,
    name,
    targets,
  }));
};

