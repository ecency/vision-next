"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { xSvg, redditSvg } from "@ui/svg";
import { Tooltip } from "@ui/tooltip";

interface Props {
  username: string;
  className?: string;
}

interface Links {
  twitter_profile?: string;
  twitter_username?: string;
  reddit_profile?: string;
  reddit_username?: string;
}

export function HivePosh({ username, className = "" }: Props) {
  const [links, setLinks] = useState<Links | null>(null);

  useEffect(() => {
    if (!username) {
      setLinks(null);
      return;
    }

    axios
      .get(`https://hiveposh.com/api/v0/linked-accounts/${username}`)
      .then((res) => {
        const data = res.data;
        if (!data.error) {
          setLinks({
            twitter_profile: data.twitter_profile,
            twitter_username: data.twitter_username,
            reddit_profile: data.reddit_profile,
            reddit_username: data.reddit_username
          });
        } else {
          setLinks(null);
        }
      })
      .catch(() => setLinks(null));
  }, [username]);

  if (!links?.twitter_profile && !links?.reddit_profile) {
    return null;
  }

  return (
    <div className={className}>
      <div className="social-links flex justify-center gap-3 md:hidden">
        {links.twitter_profile && (
          <Tooltip content="Powered by HivePosh.com">
            <a target="_blank" href={links.twitter_profile}>
              {xSvg}
            </a>
          </Tooltip>
        )}
        {links.reddit_profile && (
          <Tooltip content="Powered by HivePosh.com">
            <a target="_blank" href={links.reddit_profile}>
              {redditSvg}
            </a>
          </Tooltip>
        )}
      </div>
      <div className="hidden md:flex md:flex-col">
        {links.twitter_profile && (
          <div className="prop social-link">
            <Tooltip content="Powered by HivePosh.com">
              <a
                target="_blank"
                className="flex items-center gap-1"
                href={links.twitter_profile}
              >
                {xSvg}
                <span>{links.twitter_username}</span>
              </a>
            </Tooltip>
          </div>
        )}
        {links.reddit_profile && (
          <div className="prop social-link">
            <Tooltip content="Powered by HivePosh.com">
              <a
                target="_blank"
                className="flex items-center gap-1"
                href={links.reddit_profile}
              >
                {redditSvg}
                <span>{links.reddit_username}</span>
              </a>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  );
}

