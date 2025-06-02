"use client";

import { Alert } from "@/features/ui";
import { Accordion, AccordionCollapse, AccordionToggle } from "@/features/ui/accordion";
import i18next from "i18next";
import Image from "next/image";

export default function PromotePost() {
  return (
    <div className="p-2 md:p-4 flex flex-col gap-4">
      <h1 className="uppercase text-sm text-gray-600 dark:text-gray-400 font-semibold">
        {i18next.t("perks.promote-title")}
      </h1>
      <Image width={400} height={400} alt="" src="/assets/undraw-promote.svg" />
      <div>{i18next.t("perks.promote-text")}</div>
      <Accordion>
        <AccordionToggle eventKey="hiw">
          {i18next.t("static.faq.how-promotion-work-header")}
        </AccordionToggle>
        <AccordionCollapse
          eventKey="hiw"
          dangerouslySetInnerHTML={{ __html: i18next.t("static.faq.how-promotion-work-body") }}
        />
      </Accordion>
    </div>
  );
}
