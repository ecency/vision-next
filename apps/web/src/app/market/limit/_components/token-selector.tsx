"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import { FormControl } from "@ui/input";
import { HiveEngineTokenInfo } from "@/entities";
import i18next from "i18next";

export type MarketSelection = { type: "core" } | { type: "engine"; symbol: string };

interface Props {
  selection: MarketSelection;
  onSelect: (selection: MarketSelection) => void;
  tokens: HiveEngineTokenInfo[];
  loading: boolean;
}

const CORE_LABEL = "HBD/HIVE";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9.]/g, "");

const matchesCore = (query: string) => {
  if (!query) {
    return true;
  }

  const normalized = normalize(query);
  return ["hbd", "hive", "core", "layer1", "layerone", "l1"].some((item) =>
    item.includes(normalized)
  );
};

const selectionLabel = (selection: MarketSelection) => {
  if (selection.type === "core") {
    return `${CORE_LABEL} · ${i18next.t("market.limit.layer-core")}`;
  }

  return `${selection.symbol}/SWAP.HIVE · ${i18next.t("market.limit.layer-engine")}`;
};

const LayerBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-border-default px-2 py-0.5 text-[11px] uppercase tracking-wide text-text-muted">
    {children}
  </span>
);

export function MarketTokenSelector({ selection, onSelect, tokens, loading }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");

  const normalizedQuery = useMemo(() => normalize(query), [query]);

  const filteredTokens = useMemo(() => {
    if (!normalizedQuery) {
      return tokens;
    }

    return tokens.filter((token) => normalize(token.symbol).includes(normalizedQuery));
  }, [tokens, normalizedQuery]);

  const handleSelect = (next: MarketSelection) => {
    onSelect(next);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  return (
    <div className="mb-5 flex flex-col gap-2">
      <label className="text-sm font-semibold" htmlFor="market-token-selector-trigger">
        {i18next.t("market.limit.token-selector.label")}
      </label>
      <Button
        id="market-token-selector-trigger"
        appearance="secondary"
        outline
        className="justify-between"
        onClick={() => setIsOpen(true)}
      >
        <span className="font-medium">{selectionLabel(selection)}</span>
      </Button>

      <Modal show={isOpen} centered onHide={() => setIsOpen(false)}>
        <ModalHeader closeButton>
          <ModalTitle>{i18next.t("market.limit.token-selector.title")}</ModalTitle>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <FormControl
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={i18next.t("market.limit.token-selector.search-placeholder") ?? ""}
            />

            <div className="flex max-h-80 flex-col gap-2 overflow-y-auto">
              {matchesCore(query) && (
                <button
                  type="button"
                  onClick={() => handleSelect({ type: "core" })}
                  className={`flex items-center justify-between rounded border p-3 text-left transition hover:border-border-highlight hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                    selection.type === "core" ? "border-border-highlight" : "border-border-default"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{CORE_LABEL}</span>
                    <span className="text-xs text-text-muted">
                      {i18next.t("market.limit.token-selector.core-description")}
                    </span>
                  </div>
                  <LayerBadge>{i18next.t("market.limit.layer-core")}</LayerBadge>
                </button>
              )}

              {loading && (
                <div className="rounded border border-border-default p-3 text-center text-sm text-text-muted">
                  {i18next.t("g.loading")}
                </div>
              )}

              {!loading && filteredTokens.length === 0 && (
                <div className="rounded border border-border-default p-3 text-center text-sm text-text-muted">
                  {i18next.t("market.limit.token-selector.no-results")}
                </div>
              )}

              {!loading &&
                filteredTokens.map((token) => {
                  const isSelected = selection.type === "engine" && selection.symbol === token.symbol;
                  return (
                    <button
                      key={token.symbol}
                      type="button"
                      onClick={() => handleSelect({ type: "engine", symbol: token.symbol })}
                      className={`flex items-center justify-between rounded border p-3 text-left transition hover:border-border-highlight hover:bg-blue-50 dark:hover:bg-blue-900/20 ${
                        isSelected ? "border-border-highlight" : "border-border-default"
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold">{token.symbol}/SWAP.HIVE</span>
                        <span className="text-xs text-text-muted">
                          {i18next.t("market.limit.token-selector.engine-description")}
                        </span>
                      </div>
                      <LayerBadge>{i18next.t("market.limit.layer-engine")}</LayerBadge>
                    </button>
                  );
                })}
            </div>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}
