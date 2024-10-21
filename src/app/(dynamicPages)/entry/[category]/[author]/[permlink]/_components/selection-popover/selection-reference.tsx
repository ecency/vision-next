import React from "react";
import { Reference } from "react-popper";

// https://github.com/FezVrasta/react-popper#usage-without-a-reference-htmlelement
class VirtualSelectionReference {
  selection: Selection;
  constructor(selection: Selection) {
    this.selection = selection;
  }

  get clientWidth() {
    return this.getBoundingClientRect()?.width ?? 0;
  }

  get clientHeight() {
    return this.getBoundingClientRect()?.height ?? 0;
  }

  getBoundingClientRect() {
    if (this.selection.rangeCount > 0) {
      return this.selection.getRangeAt(0).getBoundingClientRect();
    }
  }
}

let SelectionReference = ({ onSelect, children }: any) => (
  <Reference>
    {({ ref }: any) =>
      children(({ onMouseUp, ...rest }: any = {}) => ({
        ...rest,
        onMouseUp: (...args: any) => {
          let selection = window.getSelection();

          if (selection && !selection.isCollapsed) {
            ref(new VirtualSelectionReference(selection));
            onSelect && onSelect(selection, ...args);
          }

          onMouseUp && onMouseUp(...args);
        }
      }))
    }
  </Reference>
);

export default SelectionReference;
