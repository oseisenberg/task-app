import { useState } from "react";
import { useAppData } from "./useAppData";
import { FocusView } from "./FocusView";
import { SearchView } from "./SearchView";
import { ImportExport } from "./ImportExport";

type Tab = "focus" | "search";

export function App() {
  const { data, update, setData } = useAppData();
  const [tab, setTab] = useState<Tab>("focus");

  return (
    <div className="app">
      <header className="topbar">
        <h1>Tasks</h1>
        <ImportExport data={data} onImport={setData} />
      </header>

      <main className="content">
        {tab === "focus" ? (
          <FocusView data={data} update={update} />
        ) : (
          <SearchView data={data} update={update} />
        )}
      </main>

      {/* Only two tabs: Focus + Search. No "all tasks" tab by design. */}
      <nav className="tabs">
        <button
          className={tab === "focus" ? "active" : ""}
          onClick={() => setTab("focus")}
        >
          Focus
        </button>
        <button
          className={tab === "search" ? "active" : ""}
          onClick={() => setTab("search")}
        >
          Search
        </button>
      </nav>
    </div>
  );
}
