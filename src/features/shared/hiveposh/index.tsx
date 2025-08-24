"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { xSvg, redditSvg } from "@ui/svg";
import { StyledTooltip } from "@ui/tooltip";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getHivePoshLinksQueryOptions } from "@ecency/sdk";
import { Button } from "@/features/ui";

interface Props {
  username: string;
  className?: string;
}

export function HivePosh({ username, className = "" }: Props) {
  const { data: links } = useQuery(getHivePoshLinksQueryOptions(username));

  if (!links || (!links?.twitter.profile && !links?.reddit.profile)) {
    return <></>;
  }

  return (
    <div className={className}>
      <div className="social-links flex flex-col justify-center gap-2">
        {links.twitter.profile && (
          <StyledTooltip content="Powered by HivePosh.com">
            <Link target="_external" href={links.twitter.profile}>
              <Button appearance="gray" size="sm" icon={xSvg}>
                {links.twitter.username}
              </Button>
            </Link>
          </StyledTooltip>
        )}
        {links.reddit.profile && (
          <StyledTooltip content="Powered by HivePosh.com">
            <Link target="_external" href={links.reddit.profile}>
              <Button appearance="gray" size="sm" icon={redditSvg}>
                {links.reddit.username}
              </Button>
            </Link>
          </StyledTooltip>
        )}
      </div>
    </div>
  );
}
