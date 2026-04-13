import { SandpackProvider, SandpackPreview } from "@codesandbox/sandpack-react";

import CodeTask from "./CodeTask/CodeTask";

function CodeWithPreview({ code, setCode }) {
    return (
        <div style={{ display: "flex", gap: "20px" }}>
            {/* LEFT: Monaco */}
            <div style={{ flex: 1 }}>
                <CodeTask value={code} setValue={setCode} />
            </div>

            {/* RIGHT: Preview ONLY */}
            <div style={{ flex: 1 }}>
                <SandpackProvider
                    template="react"
                    files={{
                        "/App.js": code,
                    }}
                >
                    <SandpackPreview
                        style={{ height: "400px", borderRadius: "10px" }}
                    />
                </SandpackProvider>
            </div>
        </div>
    );
}

export default CodeWithPreview;
