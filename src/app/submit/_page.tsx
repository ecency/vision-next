"use client";

import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { PostBase, VideoProps } from "./_types";
import {
  BodyVersioningManager,
  ThreeSpeakManager,
  useAdvancedManager,
  useApiDraftDetector,
  useBodyVersioningManager,
  useCommunityDetector,
  useEntryDetector,
  useLocalDraftManager,
  useThreeSpeakManager
} from "./_hooks";
import { postBodySummary, proxifyImageSrc } from "@ecency/render-helper";
import useLocalStorage from "react-use/lib/useLocalStorage";
import usePrevious from "react-use/lib/usePrevious";
import { checkSvg, informationSvg } from "@/assets/img/svg";
import moment from "moment/moment";
import isEqual from "react-fast-compare";
import { handleShortcuts } from "./_functions";
import {
  BeneficiaryEditorDialog,
  CommunitySelector,
  EditorActions,
  EditorPanelActions,
  PostSchedulerDialog,
  SubmitPreviewContent,
  SubmitVideoAttachments,
  TagSelector,
  WordCount
} from "@/app/submit/_components";
import "./_index.scss";
import { useThreeSpeakMigrationAdapter } from "@/app/submit/_hooks/three-speak-migration-adapter";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { IntroTour } from "@ui/intro-tour";
import { PollsContext, PollsManager } from "@/app/submit/_hooks/polls-manager";
import { FullHeight } from "@/features/ui";
import {
  AvailableCredits,
  EditorToolbar,
  error,
  Feedback,
  Navbar,
  Theme,
  toolbarEventListener
} from "@/features/shared";
import i18next from "i18next";
import { extractMetaData, isCommunity } from "@/utils";
import { Draft, Entry, RewardType } from "@/entities";
import { TextareaAutocomplete } from "@/features/shared/textarea-autocomplete";
import { useEntryPollExtractor } from "@/features/polls";
import { PREFIX } from "@/utils/local-storage";
import { useGlobalStore } from "@/core/global-store";
import { useRouter } from "next/navigation";
import { EcencyConfigManager } from "@/config";
import { SUBMIT_TOUR_ITEMS } from "@/app/submit/_consts";

interface Props {
  path: string;
  username?: string;
  permlink?: string;
  draftId?: string;
  searchParams?: Record<string, string | undefined>;
}

function Submit({ path, draftId, username, permlink, searchParams }: Props) {
  const postBodyRef = useRef<HTMLDivElement | null>(null);
  const threeSpeakManager = useThreeSpeakManager();
  const { setActivePoll, activePoll, clearActivePoll } = useContext(PollsContext);
  const { body, setBody } = useBodyVersioningManager();

  const router = useRouter();
  const activeUser = useGlobalStore((s) => s.activeUser);
  const previousActiveUser = usePrevious(activeUser);

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectionTouched, setSelectionTouched] = useState(false);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail, removeThumbnail] = useLocalStorage<string>(
    PREFIX + "draft_selected_image"
  );
  const [preview, setPreview] = useState<PostBase>({
    title: "",
    tags: [],
    body: "",
    description: ""
  });
  const [disabled, setDisabled] = useState(true);
  const [drafts, setDrafts] = useState(false);
  const [isDraftEmpty, setIsDraftEmpty] = useState(false);
  const [forceReactivateTour, setForceReactivateTour] = useState(false);

  // Misc
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editingDraft, setEditingDraft] = useState<Draft | null>(null);
  const [isTourFinished] = useLocalStorage(PREFIX + `_itf_submit`, false);

  const postPoll = useEntryPollExtractor(editingEntry);

  const tourEnabled = useMemo(() => !activeUser, [activeUser]);
  const introSteps = useMemo(() => SUBMIT_TOUR_ITEMS, []);

  let _updateTimer: any; // todo think about it

  const { setLocalDraft } = useLocalDraftManager(
    path,
    username,
    permlink,
    draftId,
    setIsDraftEmpty,
    (title, tags, body) => {
      setTitle(title);
      setTags(tags);
      setBody(body);
    }
  );
  const {
    advanced,
    setAdvanced,
    reward,
    setReward,
    description,
    setDescription,
    reblogSwitch,
    setReblogSwitch,
    beneficiaries,
    setBeneficiaries,
    schedule,
    setSchedule,
    clearAdvanced,
    getHasAdvanced
  } = useAdvancedManager();

  useThreeSpeakMigrationAdapter({
    body,
    setBody
  });

  useCommunityDetector((community) => setTags([...tags, community]));

  useEntryDetector(username, permlink, (entry) => {
    if (entry) {
      setTitle(entry.title);
      setTags(Array.from(new Set(entry.json_metadata?.tags ?? [])));
      setBody(entry.body);
      setDescription(entry.json_metadata?.description ?? postBodySummary(body, 200));
      entry?.json_metadata?.image && setSelectedThumbnail(entry?.json_metadata?.image[0]);
      setEditingEntry(entry);
      threeSpeakManager.setIsEditing(true);
    } else if (editingEntry) {
      setEditingEntry(null);
      threeSpeakManager.setIsEditing(false);
    } else {
      threeSpeakManager.setIsEditing(false);
    }
  });

  useApiDraftDetector(
    draftId,
    (draft) => {
      setTitle(draft.title);
      setTags(
        draft.tags
          .trim()
          .split(/[ ,]+/)
          .filter((t) => !!t)
      );
      setBody(draft.body);
      setEditingDraft(draft);
      setBeneficiaries(draft.meta?.beneficiaries ?? []);
      setReward(draft.meta?.rewardType ?? "default");
      setSelectedThumbnail(draft.meta?.image?.[0]);
      setDescription(draft.meta?.description ?? "");

      [...Object.values(draft.meta?.videos ?? {})].forEach((item) =>
        threeSpeakManager.attach(item)
      );

      setTimeout(() => setIsDraftEmpty(false), 100);
    },
    () => {
      clear();
      router.replace("/submit");
    }
  );

  useEffect(() => {
    if (postPoll) {
      setActivePoll(postPoll);
    }
  }, [postPoll]);

  useEffect(() => {
    if (postBodyRef.current) {
      postBodyRef.current.addEventListener("paste", (event) =>
        toolbarEventListener(event, "paste")
      );
      postBodyRef.current.addEventListener("dragover", (event) =>
        toolbarEventListener(event, "dragover")
      );
      postBodyRef.current.addEventListener("drop", (event) => toolbarEventListener(event, "drop"));
    }
  }, [postBodyRef]);

  useEffect(() => {
    if (activeUser?.username !== previousActiveUser?.username && activeUser && previousActiveUser) {
      // delete active user from beneficiaries list
      setBeneficiaries(beneficiaries.filter((x) => x.account !== activeUser.username));

      // clear not current user videos
      threeSpeakManager.clear();
    }
  }, [activeUser, beneficiaries, previousActiveUser, setBeneficiaries, threeSpeakManager]);

  useEffect(() => {
    setLocalDraft({ tags, title, body, description });
  }, [tags, title, body, setLocalDraft, description]);

  useEffect(() => {
    updatePreview();
  }, [title, body, tags]);

  useEffect(() => {
    threeSpeakManager.checkBodyForVideos(body);
  }, [body]);

  useEffect(() => {
    if (searchParams && typeof searchParams?.cat === "string" && searchParams.cat.length > 0) {
      setTags((value) => Array.from(new Set(value).add(searchParams.cat!)));
    }
  }, [searchParams]);

  const updatePreview = (): void => {
    if (_updateTimer) {
      clearTimeout(_updateTimer);
      _updateTimer = null;
    }

    // Not sure why we are using setTimeOut(), but it causes some odd behavior and sets input value to preview.body when you try to delete/cancel text
    _updateTimer = setTimeout(() => {
      const { thumbnails } = extractMetaData(body);
      setPreview({ title, tags, body, description });
      const existingImages = editingEntry?.json_metadata.image ?? [];
      const newThumbnails = thumbnails ? [...existingImages, ...thumbnails] : existingImages;
      setThumbnails(Array.from(new Set(newThumbnails)));
      if (editingEntry === null) {
        setLocalDraft({ title, tags, body, description });
      }
      setIsDraftEmpty(!Boolean(title?.length || tags?.length || body?.length));
    }, 50);
  };

  const clear = () => {
    setTitle("");
    setTags([]);
    setBody("");

    // clear advanced
    setAdvanced(false);
    setReward("default");
    setBeneficiaries([]);
    setSchedule(null);
    setReblogSwitch(false);
    setIsDraftEmpty(true);
    setDescription("");

    threeSpeakManager.clear();
    clearAdvanced();
    removeThumbnail();
  };

  const tagsChanged = (nextTags: string[]): void => {
    if (isEqual(tags, nextTags)) {
      // tag selector calls onchange event 2 times on each change.
      // one for add event one for sort event.
      // important to check if tags really changed.
      return;
    }

    setTags(nextTags);

    // Toggle off reblog switch if it is true and the first tag is not community tag.
    if (reblogSwitch) {
      const isCommunityTag = tags?.length > 0 && isCommunity(tags[0]);

      if (!isCommunityTag) {
        setReblogSwitch(false);
      }
    }
  };

  const setVideoEncoderBeneficiary = async (video: VideoProps) => {
    const videoBeneficiary = JSON.parse(video.beneficiaries);
    const videoEncoders = [
      {
        account: "spk.beneficiary",
        src: "ENCODER_PAY",
        weight: 1000
      }
    ];
    const joinedBeneficiary = [...videoBeneficiary, ...videoEncoders];
    setBeneficiaries(joinedBeneficiary);
  };

  const focusInput = (parentSelector: string): void => {
    const el = document.querySelector(`${parentSelector} .form-control`) as HTMLInputElement;
    if (el) {
      el.focus();
    }
  };

  const validate = () => {
    if (title.trim() === "") {
      focusInput(".title-input");
      error(i18next.t("submit.empty-title-alert"));
      return false;
    }

    if (tags?.length === 0) {
      focusInput(".tag-input");
      error(i18next.t("submit.empty-tags-alert"));
      return false;
    }

    if (body.trim() === "") {
      focusInput(".body-input");
      error(i18next.t("submit.empty-body-alert"));
      return false;
    }

    if (threeSpeakManager.hasMultipleUnpublishedVideo) {
      error(i18next.t("submit.should-be-only-one-unpublished"));
      return false;
    }

    return true;
  };

  return (
    <>
      <FullHeight />
      <Theme />
      <Feedback />
      <Navbar />

      <IntroTour
        forceActivation={forceReactivateTour}
        setForceActivation={setForceReactivateTour}
        steps={introSteps}
        id="submit"
        enabled={tourEnabled}
      />

      <div className="app-content submit-page">
        <div className="editor-panel">
          {editingEntry === null && activeUser && (
            <div className="community-input whitespace-nowrap">
              <CommunitySelector
                tags={tags}
                onSelect={(prev, next) => {
                  const newTags = [...[next ? next : ""], ...tags.filter((x) => x !== prev)].filter(
                    (x) => x
                  );

                  tagsChanged(newTags);
                }}
              />

              <div className="flex justify-end w-full items-center gap-4">
                <Button
                  size="sm"
                  appearance="gray-link"
                  onClick={() => setForceReactivateTour(true)}
                  icon={informationSvg}
                >
                  {!isTourFinished && i18next.t("submit.take-tour")}
                </Button>
              </div>
            </div>
          )}
          <EditorToolbar
            setVideoEncoderBeneficiary={setVideoEncoderBeneficiary}
            toggleNsfwC={() => {
              threeSpeakManager.setIsNsfw(true);
            }}
            comment={false}
            existingPoll={activePoll}
            setVideoMetadata={(v) => {
              threeSpeakManager.attach(v);
              // Attach videos as special token in a body and render it in a preview
              setBody(`${body}\n[3speak](${v._id})`);
            }}
            onAddPoll={(v) => setActivePoll(v)}
            onDeletePoll={() => clearActivePoll()}
            readonlyPoll={!!editingEntry}
          />
          <div className="title-input">
            <FormControl
              id="submit-title"
              noStyles={true}
              type="text"
              className="accepts-emoji form-control px-3 py-1 w-full outline-none shadow-0"
              placeholder={i18next.t("submit.title-placeholder")}
              autoFocus={true}
              value={title}
              dir={"auto"}
              onChange={(e) => setTitle(e.target.value)}
              spellCheck={true}
            />
          </div>
          <div className="tag-input">
            <TagSelector
              tags={tags}
              maxItem={10}
              onChange={tagsChanged}
              onValid={(v) => setDisabled(v)}
            />
          </div>
          <div className="body-input" onKeyDown={handleShortcuts} ref={postBodyRef}>
            <TextareaAutocomplete
              acceptCharset="UTF-8"
              id="the-editor"
              className="the-editor accepts-emoji form-control"
              as="textarea"
              placeholder={i18next.t("submit.body-placeholder")}
              value={body}
              onChange={(e: { target: { value: string } }) => {
                setBody(e.target.value);
              }}
              disableRows={true}
              maxrows={100}
              dir={"auto"}
              spellCheck={true}
            />
          </div>
          <SubmitVideoAttachments />
          {activeUser ? (
            <AvailableCredits
              className="mr-2"
              operation="comment_operation"
              username={activeUser.username}
            />
          ) : (
            <></>
          )}
          <EditorPanelActions
            onClear={clear}
            advanced={advanced}
            getHasAdvanced={getHasAdvanced}
            setAdvanced={setAdvanced}
            editingEntry={editingEntry}
            editingDraft={editingDraft}
          />
        </div>
        <div className="flex-spacer" />
        {advanced && (
          <div className="advanced-panel">
            <div className="panel-header">
              <h2 className="panel-header-title">{i18next.t("submit.advanced")}</h2>
            </div>
            <div className="panel-body">
              <div className="container px-3">
                {editingEntry === null && (
                  <>
                    <div className="grid grid-cols-12 mb-4">
                      <div className="col-span-12 sm:col-span-3">
                        <label>{i18next.t("submit.reward")}</label>
                      </div>
                      <div className="col-span-12 sm:col-span-9">
                        <FormControl
                          type="select"
                          value={reward}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            setReward(e.target.value as RewardType);
                          }}
                        >
                          <option value="default">{i18next.t("submit.reward-default")}</option>
                          <option value="sp">{i18next.t("submit.reward-sp")}</option>
                          <option value="dp">{i18next.t("submit.reward-dp")}</option>
                        </FormControl>
                        <small className="text-gray-600 dark:text-gray-400">
                          {i18next.t("submit.reward-hint")}
                        </small>
                      </div>
                    </div>
                    <div className="grid grid-cols-12 mb-4">
                      <div className="col-span-12 sm:col-span-3">
                        <label>{i18next.t("submit.beneficiaries")}</label>
                      </div>
                      <div className="col-span-12 sm:col-span-9">
                        <BeneficiaryEditorDialog
                          body={body}
                          author={activeUser?.username}
                          list={beneficiaries}
                          onAdd={(item) => {
                            const b = [...beneficiaries, item].sort((a, b) =>
                              a.account < b.account ? -1 : 1
                            );
                            setBeneficiaries(b);
                          }}
                          onDelete={(username) => {
                            const b = [
                              ...beneficiaries.filter(
                                (x: { account: string }) => x.account !== username
                              )
                            ];
                            setBeneficiaries(b);
                          }}
                        />
                        <small className="text-gray-600 dark:text-gray-400">
                          {i18next.t("submit.beneficiaries-hint")}
                        </small>
                      </div>
                    </div>
                  </>
                )}
                <div className="grid grid-cols-12 mb-4">
                  <div className="col-span-12 sm:col-span-3">
                    <label>{i18next.t("submit.description")}</label>
                  </div>
                  <div className="col-span-12 sm:col-span-9">
                    <FormControl
                      type="textarea"
                      value={description || postBodySummary(body, 200)}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        setDescription(e.target.value);
                      }}
                      rows={3}
                      maxLength={200}
                    />
                    <small className="text-gray-600 dark:text-gray-400">
                      {description !== "" ? description : postBodySummary(body, 200)}
                    </small>
                  </div>
                </div>
                {editingEntry === null && (
                  <EcencyConfigManager.Conditional
                    condition={({ visionFeatures }) => visionFeatures.schedules.enabled}
                  >
                    {!threeSpeakManager.hasUnpublishedVideo && (
                      <div className="grid grid-cols-12 mb-4">
                        <div className="col-span-12 sm:col-span-3">
                          <label>{i18next.t("submit.schedule")}</label>
                        </div>
                        <div className="col-span-12 sm:col-span-9">
                          <PostSchedulerDialog
                            date={schedule ? moment(schedule) : null}
                            onChange={(d) => {
                              setSchedule(d ? d.toISOString(true) : null);
                            }}
                          />
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {i18next.t("submit.schedule-hint")}
                          </div>
                        </div>
                      </div>
                    )}
                  </EcencyConfigManager.Conditional>
                )}
                {editingEntry === null && tags?.length > 0 && isCommunity(tags[0]) && (
                  <div className="grid grid-cols-12 mb-4">
                    <div className="col-span-12 sm:col-span-3" />
                    <div className="col-span-12 sm:col-span-9">
                      <FormControl
                        type="checkbox"
                        isToggle={true}
                        id="reblog-switch"
                        label={i18next.t("submit.reblog")}
                        checked={reblogSwitch}
                        onChange={(v) => {
                          setReblogSwitch(v);
                        }}
                      />
                      <small className="text-gray-600 dark:text-gray-400">
                        {i18next.t("submit.reblog-hint")}
                      </small>
                    </div>
                  </div>
                )}
                {thumbnails?.length > 0 && (
                  <div className="grid grid-cols-12 mb-4">
                    <div className="col-span-12 sm:col-span-3">
                      <label>{i18next.t("submit.thumbnail")}</label>
                    </div>
                    <div className="col-span-12 sm:col-span-9 flex flex-wrap selection-container">
                      {Array.from(new Set(thumbnails)).map((item, i) => {
                        let selectedItem = selectedThumbnail;
                        switch (selectedItem) {
                          case "":
                            selectedItem = thumbnails[0];
                            break;
                        }
                        if (!thumbnails.includes(selectedThumbnail ?? "")) {
                          selectedItem = thumbnails[0];
                        }
                        return (
                          <div className="relative" key={item + i}>
                            <div
                              className={`selection-item shadow ${
                                selectedItem === item ? "selected" : ""
                              } mr-3 mb-2`}
                              style={{
                                backgroundImage: `url("${proxifyImageSrc(item, 260, 200)}")`
                              }}
                              onClick={() => {
                                setSelectedThumbnail(item);
                                setSelectionTouched(true);
                              }}
                              key={item}
                            />
                            {selectedItem === item && (
                              <div className="text-green check absolute bg-white rounded-full p-1 flex justify-center items-center">
                                {checkSvg}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <EditorActions
              isDraftEmpty={isDraftEmpty}
              drafts={drafts}
              setDrafts={setDrafts}
              onClear={clear}
              editingDraft={editingDraft}
              editingEntry={editingEntry}
              schedule={schedule}
              title={title}
              tags={tags}
              body={body}
              reward={reward}
              reblogSwitch={reblogSwitch}
              beneficiaries={beneficiaries}
              description={description}
              selectedThumbnail={selectedThumbnail}
              selectionTouched={false}
              validate={validate}
            />
          </div>
        )}
        {!advanced && (
          <div className="preview-panel">
            <div className="panel-header">
              <h2 className="panel-header-title">{i18next.t("submit.preview")}</h2>
              <WordCount selector=".preview-body" watch={true} />
            </div>
            <SubmitPreviewContent title={preview.title} body={preview.body} tags={preview.tags} />
            <EditorActions
              isDraftEmpty={isDraftEmpty}
              drafts={drafts}
              setDrafts={setDrafts}
              onClear={clear}
              editingDraft={editingDraft}
              editingEntry={editingEntry}
              schedule={schedule}
              title={title}
              tags={tags}
              body={body}
              reward={reward}
              reblogSwitch={reblogSwitch}
              beneficiaries={beneficiaries}
              description={description}
              selectedThumbnail={selectedThumbnail}
              selectionTouched={false}
              validate={validate}
            />
          </div>
        )}
      </div>
    </>
  );
}

export const SubmitWithProvidersPage = (props: Props) => {
  return (
    <BodyVersioningManager>
      <ThreeSpeakManager>
        <PollsManager>
          <Submit {...props} />
        </PollsManager>
      </ThreeSpeakManager>
    </BodyVersioningManager>
  );
};
