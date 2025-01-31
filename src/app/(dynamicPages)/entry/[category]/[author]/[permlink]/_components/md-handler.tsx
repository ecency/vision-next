"use client";

import useMount from "react-use/lib/useMount";

export function MdHandler() {
  const goToElementWhenActive = () => {
    // go to element when active page
    setTimeout(() => {
      const urlHash = location.hash;
      !!urlHash && goToElement(urlHash);
    }, 300);
  };

  const goToElement = (hashKey: string = "") => {
    if (!!hashKey) {
      const _data_id = hashKey.replace("#", ""); // remove # from internal href. EX: #test => test
      const get_element_by_data_id = document.querySelectorAll(`[data-id="${_data_id}"]`);
      get_element_by_data_id.length > 0 &&
        get_element_by_data_id[0].scrollIntoView({ behavior: "smooth" });
    }
  };

  useMount(() => {
    goToElementWhenActive();
  });

  return <></>;
}
