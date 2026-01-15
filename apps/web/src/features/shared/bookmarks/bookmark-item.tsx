import { EcencyEntriesCacheManagement } from "@/core/caches";
import { motion } from "framer-motion";
import { EntryListItem } from "../entry-list-item";
import { useQuery } from "@tanstack/react-query";

interface Props {
  author: string;
  permlink: string;
  i: number;
}

export function BookmarkItem({ author, permlink, i }: Props) {
  const { data: entry } = useQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
    author,
    permlink
  ));
  if (!entry) {
    return <></>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.2, delay: 0.1 * i }}
      className="border border-[--border-color] rounded-lg px-4 bg-white"
    >
      <EntryListItem entry={entry} order={0} />
    </motion.div>
  );
}
