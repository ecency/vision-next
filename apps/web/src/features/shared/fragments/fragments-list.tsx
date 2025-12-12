import { useActiveAccount } from "@/core/hooks/use-active-account";
import { LinearProgress } from "@/features/shared";
import { Fragment, getFragmentsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilMinusCircle } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { AnimatePresence } from "framer-motion";
import i18next from "i18next";
import { useEffect, useRef, useState } from "react";
import { FragmentsListItem } from "./fragments-list-item";

interface Props {
  onPick?: (body: string) => void;
  onEdit: (item: Fragment) => void;
  onAdd: () => void;
}

export function Fragments({ onPick, onAdd, onEdit }: Props) {
  const innerRef = useRef<HTMLInputElement | null>(null);

  const { activeUser } = useActiveAccount();

  const [searchQuery, setSearchQuery] = useState("");

  const { data: items, isPending } = useQuery({
    ...getFragmentsQueryOptions(activeUser!.username),
    refetchOnMount: true,
    select: (data) =>
      data
        .filter((x) => x.title.toLowerCase().indexOf(searchQuery.toLowerCase()) !== -1)
        .sort((a, b) => (new Date(b.created).getTime() > new Date(a.created).getTime() ? 1 : -1))
  });

  useEffect(() => {
    if (items && items.length > 0) {
      innerRef.current && innerRef.current.focus();
    }
  }, [items]);

  return (
    <div>
      <div className="flex gap-4">
        <FormControl
          ref={innerRef}
          type="text"
          placeholder={i18next.t("fragments.filter")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ marginRight: "6px" }}
        />
        <div>
          <Button className="min-w-[6rem] h-full" onClick={onAdd}>
            {i18next.t("g.add")}
          </Button>
        </div>
      </div>

      {isPending && <LinearProgress />}
      {!isPending && items?.length === 0 && (
        <div className="flex items-center flex-col gap-4 pt-16">
          <UilMinusCircle className="w-10 h-10 text-gray-400 dark:text-gray-600" />
          <div className="text-gray-600 dark:text-gray-400 text-lg">
            {i18next.t("g.empty-list")}
          </div>
          <Button onClick={onAdd} size="sm">
            {i18next.t("fragments.create-first")}
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 my-4">
        <AnimatePresence>
          {items?.map((item, index) => (
            <FragmentsListItem
              item={item}
              index={index}
              onPick={() => onPick?.(item.body)}
              onEdit={() => onEdit(item)}
              key={item.id}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
