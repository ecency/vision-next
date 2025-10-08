import dayjs from "@/utils/dayjs";

type Identifiable = Omit<any, "id"> & Required<{ id: string | number }>;

export function newDataComingPaginatedCondition(
  newCameData: Identifiable[],
  prevData?: Identifiable[],
  dateProperty = "created"
) {
  const newCame = newCameData.filter((i) => !prevData?.some((it) => i.id === it.id))[0];
  const prevOne = (prevData ?? [])[0];
  return (
    prevData?.length === 0 ||
    dayjs(newCame?.[dateProperty]).isBefore(dayjs(prevOne?.[dateProperty]))
  );
}
