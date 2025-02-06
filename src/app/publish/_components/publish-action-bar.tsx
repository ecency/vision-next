"use client";

import { Button } from "@ui/button";
import {
  UilClock,
  UilDocumentInfo,
  UilEllipsisV,
  UilFileEditAlt,
  UilMoneybag,
  UilTrash,
  UilUsersAlt
} from "@tooni/iconscout-unicons-react";
import { Dropdown, DropdownItemWithIcon, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import React, { useState } from "react";
import { PublishRewardsDialog } from "@/app/publish/_components/publish-rewards-dialog";

export function PublishActionBar() {
  const [showReward, setShowReward] = useState(false);

  return (
    <div className="container justify-end gap-4 flex max-w-[800px] py-4 mx-auto publish-action-bar">
      <Button appearance="success">Publish</Button>
      <Dropdown>
        <DropdownToggle>
          <Button icon={<UilEllipsisV />} appearance="gray-link" />
        </DropdownToggle>
        <DropdownMenu align="right">
          <DropdownItemWithIcon
            onClick={() => setShowReward(true)}
            icon={<UilMoneybag />}
            label="Reward settings"
          />
          <DropdownItemWithIcon icon={<UilUsersAlt />} label="Beneficiaries" />
          <DropdownItemWithIcon icon={<UilDocumentInfo />} label="Meta information" />
          <div className="border-b border-[--border-color] h-[1px] w-full" />
          <DropdownItemWithIcon icon={<UilFileEditAlt />} label="Save to draft" />
          <DropdownItemWithIcon icon={<UilClock />} label="Schedule" />
          <DropdownItemWithIcon className="!text-red" icon={<UilTrash />} label="Clear" />
        </DropdownMenu>
      </Dropdown>

      <PublishRewardsDialog show={showReward} setShow={setShowReward} />
    </div>
  );
}
