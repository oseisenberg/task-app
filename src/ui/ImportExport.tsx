import { useRef, useState } from "react";
import type { AppData } from "../core/types";
import { deserialize, merge, serialize } from "../core/store";

interface Props {
  data: AppData;
  onImport: (data: AppData) => void;
}

// Export to / import from a JSON file. This is the Claude-cowork loop:
// export, let the AI edit the file, import it back. No special integration.
// Import can REPLACE everything or MERGE by task id (for partial AI edits).
export function ImportExport({ data, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [mergeMode, setMergeMode] = useState(true);

  const exportFile = () => {
    const blob = new Blob([serialize(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFile = async (file: File) => {
    try {
      const incoming = deserialize(await file.text());
      onImport(mergeMode ? merge(data, incoming) : incoming);
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="io">
      <button onClick={exportFile}>Export</button>
      <button onClick={() => fileRef.current?.click()}>Import</button>
      <label className="checkbox" title="Merge by task id vs replace all">
        <input
          type="checkbox"
          checked={mergeMode}
          onChange={(e) => setMergeMode(e.target.checked)}
        />
        merge
      </label>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) importFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
