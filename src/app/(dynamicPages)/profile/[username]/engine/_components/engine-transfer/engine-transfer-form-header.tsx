import i18next from "i18next";

interface Props {
  titleLngKey: string;
  subTitleLngKey: string;
  step: number;
}

export function EngineTransferFormHeader({ titleLngKey, subTitleLngKey, step }: Props) {
  return (
    <div className="transaction-form-header">
      <div className="step-no">{step}</div>
      <div className="box-titles">
        <div className="main-title">{i18next.t(`transfer.${titleLngKey}`)}</div>
        <div className="sub-title">{i18next.t(`transfer.${subTitleLngKey}`)}</div>
      </div>
    </div>
  );
}
