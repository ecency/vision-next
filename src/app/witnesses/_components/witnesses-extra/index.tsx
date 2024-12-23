import React, { useState } from "react";
import { WitnessVoteBtn } from "../witness-vote-btn";
import "./_index.scss";
import { FormControl } from "@ui/input";
import i18next from "i18next";

interface Props {
  list: string[];
}

export function WitnessesExtra(props: Props) {
  const [username, setUsername] = useState("");

  return (
    <div className="extra-witnesses">
      <p className="description">{i18next.t("witnesses.extra-description")}</p>
      <div className="vote-form">
        <div className="txt-username">
          <FormControl
            type="text"
            placeholder={i18next.t("witnesses.username-placeholder")}
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value.trim())}
          />
        </div>
        <div>
          <WitnessVoteBtn witness={username} />
        </div>
      </div>
      {props.list.length > 0 && (
        <div className="witnesses-list">
          {props.list.map((i) => (
            <div className="item" key={i}>
              <span className="username">{i}</span>
              <div>
                <WitnessVoteBtn witness={i} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
