import { useRef } from "react";
import type { AppData } from "../core/types";
import { deserialize, serialize } from "../core/store";

interface Props {
  data: AppData;
  onImport: (data: AppData) => void;
}

// Export to / import from a JSON file. This is the Claude-cowork loop:
// export, let the AI edit the file, import it back. No special integration.
export function ImportExport({ data, onImport }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

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
      onImport(deserialize(await file.text()));
    } catch (e) {
      alert(`Import failed: ${(e as Error).message}`);
    }
  };

  return (
    <div className="io">
      <button onClick={exportFile}>Export</button>
      <button onClick={() => fileRef.current?.click()}>Import</button>
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
