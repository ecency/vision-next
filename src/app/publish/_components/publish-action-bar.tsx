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

export function PublishActionBar() {
  return (
    <div className="container justify-end gap-4 flex max-w-[800px] py-4 mx-auto publish-action-bar">
      <Button appearance="success">Publish</Button>
      <Dropdown>
        <DropdownToggle>
          <Button icon={<UilEllipsisV />} appearance="gray-link" />
        </DropdownToggle>
        <DropdownMenu align="right">
          <DropdownItemWithIcon icon={<UilMoneybag />} label="Reward settings" />
          <DropdownItemWithIcon icon={<UilUsersAlt />} label="Beneficiaries" />
          <DropdownItemWithIcon icon={<UilDocumentInfo />} label="Meta information" />
          <div className="border-b border-[--border-color] h-[1px] w-full" />
          <DropdownItemWithIcon icon={<UilFileEditAlt />} label="Save to draft" />
          <DropdownItemWithIcon icon={<UilClock />} label="Schedule" />
          <DropdownItemWithIcon className="!text-red" icon={<UilTrash />} label="Clear" />
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
