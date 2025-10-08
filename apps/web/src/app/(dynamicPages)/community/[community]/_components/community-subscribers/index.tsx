"use client";

import React, { useMemo, useState } from "react";
import "./_index.scss";
import { getCommunitySubscribersQuery, useGetAccountsQuery } from "@/api/queries";
import { Community, roleMap, Subscription } from "@/entities";
import { LinearProgress, ProfileLink, UserAvatar } from "@/features/shared";
import { accountReputation } from "@/utils";
import { useGlobalStore } from "@/core/global-store";
import { pencilOutlineSvg } from "@ui/svg";
import { CommunityRoleEditDialog } from "@/app/(dynamicPages)/community/[community]/_components/community-role-edit";

interface Props {
  community: Community;
}

export function CommunitySubscribers({ community }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const [editingSubscriber, setEditingSubscriber] = useState<Subscription>();

  const {
    data: subscribersRaw,
    isLoading
  } = getCommunitySubscribersQuery(community).useClientQuery();

  // ✅ normalize query result to an array
  const subscribers = useMemo<Subscription[]>(
      () => (Array.isArray(subscribersRaw) ? (subscribersRaw as Subscription[]) : []),
      [subscribersRaw]
  );

  const usernames = useMemo(
      () =>
          [
            // team (excluding hive-*)
            ...community.team.filter((x) => !x[0].startsWith("hive-")),
            // subscribers not already in team
            ...subscribers.filter(
                (x) => community.team.find((y) => x[0] === y[0]) === undefined
            )
          ].map((x) => x[0]),
      [community.team, subscribers]
  );

  // ✅ default to []
  const { data: accounts = [] } = useGetAccountsQuery(usernames);

  const role = useMemo(
      () => community.team.find((x) => x[0] === activeUser?.username),
      [activeUser?.username, community.team]
  );
  const roleInTeam = role ? role[1] : null;
  const canEditTeam = !!(roleInTeam && roleMap[roleInTeam]);
  const roles = roleInTeam ? roleMap[roleInTeam] : [];

  return (
      <div className="community-subscribers mt-4 md:mt-8">
        {isLoading && <LinearProgress />}

        {!isLoading && subscribers.length > 0 && (
            <div className="user-list">
              <div className="list-body">
                {subscribers.map((item) => {
                  const [username, role] = item;
                  const account = accounts.find((x) => x.name === username);
                  const canEditRole = roles.includes(role);

                  return (
                      <div className="list-item" key={username}>
                        <div className="item-main">
                          <ProfileLink username={username}>
                            <UserAvatar username={username} size="small" />
                          </ProfileLink>
                          <div className="item-info">
                            <ProfileLink username={username}>
                              <span className="item-name notranslate">{username}</span>
                            </ProfileLink>
                            {account?.reputation !== undefined && (
                                <span className="item-reputation">
                          {accountReputation(account.reputation)}
                        </span>
                            )}
                          </div>
                        </div>

                        {canEditTeam && (
                            <div className="item-extra">
                              {role}
                              {canEditRole && (
                                  <a
                                      href="#"
                                      className="btn-edit-role"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setEditingSubscriber(item);
                                      }}
                                  >
                                    {pencilOutlineSvg}
                                  </a>
                              )}
                            </div>
                        )}
                      </div>
                  );
                })}
              </div>
            </div>
        )}

        {editingSubscriber && (
            <CommunityRoleEditDialog
                community={community}
                user={editingSubscriber[0]}
                role={editingSubscriber[1]}
                roles={roles}
                onHide={() => setEditingSubscriber(undefined)}
            />
        )}
      </div>
  );
}
