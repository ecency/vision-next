import { diff_match_patch } from "diff-match-patch";
import { Entry } from "@/entities";

export namespace EntryBodyManagement {
  class EntryBodyBuilder {
    public buildClearBody(param: string): string;
    public buildClearBody(param: Entry): string;
    public buildClearBody(param: Entry | string): string {
      if (typeof param === "string") {
        return param.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
      }
      return param.body.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, "");
    }

    public buildPatchFrom(entry: Entry, newBody: string) {
      const dmp = new diff_match_patch();
      if (entry.body === "") {
        return "";
      }
      const clearBody = this.buildClearBody(entry);
      const patches = dmp.patch_make(clearBody, newBody);
      const patch = dmp.patch_toText(patches);

      if (patch && patch.length < Buffer.from(clearBody, "utf-8").length) {
        return patch;
      }

      return newBody;
    }

    public withLocation(
      body: string,
      location?: { coordinates: { lat: number; lng: number }; address?: string }
    ) {
      if (location) {
        // Coordinates can arrive as strings (regex-parsed from an existing post
        // body, or persisted by other clients), so coerce before formatting.
        const lat = Number(location.coordinates.lat);
        const lng = Number(location.coordinates.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return body;
        }

        // The marker is a markdown comment `[//]:# (...)` that terminates at the
        // first ")", so any "(" / ")" or newline in the address would truncate
        // the directive and leak the remainder as visible post text. Many real
        // place names contain parentheses (e.g. "Frankfurt (Oder)"), so strip
        // those characters before serializing.
        const address = (location.address ?? "")
          .replace(/[()]/g, "")
          .replace(/[\r\n]+/g, " ")
          .replace(/\s+/g, " ")
          .trim();

        body += `\n\n[//]:# (!worldmappin ${lat.toFixed(6)} lat ${lng.toFixed(
          6
        )} long ${address} d3scr)`;
      }

      return body;
    }
  }

  export class EntryBodyManager {
    public static shared = new EntryBodyManager();

    public builder(): EntryBodyBuilder {
      return new EntryBodyBuilder();
    }
  }
}
