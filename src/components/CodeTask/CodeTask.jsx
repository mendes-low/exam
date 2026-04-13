import Editor from "@monaco-editor/react";
import { useRef, useEffect, useCallback, useState } from "react";

import "./CodeTask.css";

const STORAGE_KEY = "codetask_code";

const TEMPLATE = `export default function Todo() {
  const [tasks, setTasks] = React.useState([]);

  function addTask() {
    const newTask = prompt("Enter task:");
    if (newTask) setTasks([...tasks, newTask]);
  }

  return (
    <div>
      <h2>Todo List</h2>
      <ul>
        {tasks.map((task, i) => (
          <li key={i}>{task}</li>
        ))}
      </ul>
      <button onClick={addTask}>Add</button>
    </div>
  );
}
`;

const CDN = {
    react: "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.development.min.js",
    reactDom:
        "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.development.min.js",
    babel: "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.2/babel.min.js",
};

const scriptCache = {};

async function fetchScript(url) {
    if (scriptCache[url]) return scriptCache[url];
    const res = await fetch(url);
    const text = await res.text();
    scriptCache[url] = text;
    return text;
}

function buildIframeHtml(reactSrc, reactDomSrc, babelSrc) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <script>${reactSrc}</script>
  <script>${reactDomSrc}</script>
  <script>${babelSrc}</script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 16px; margin: 0; color: #1a1a1a; }
    h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 4px; }
    button { margin-top: 8px; padding: 6px 14px; background: #1a1a1a; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; }
    button:hover { background: #333; }
    input { padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px; }
    .error { color: crimson; font-size: 12px; white-space: pre-wrap; font-family: monospace; padding: 8px; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    var rootInstance = null;
    window.addEventListener("message", function (event) {
      var code = event.data;
      if (typeof code !== "string") return;
      var stripped = code
        .replace(/^import\\s[\\s\\S]*?['"][^'"]+['"]\\s*;?\\s*/gm, "")
        .replace(/^export\\s+default\\s+/m, "var __Component__ = ");
      try {
        var transformed = Babel.transform(stripped, { presets: ["react"], filename: "component.jsx" }).code;
        var fn = new Function("React", "useState", "useEffect", "useCallback", "useRef",
          transformed + "; return __Component__;");
        var Component = fn(React, React.useState, React.useEffect, React.useCallback, React.useRef);
        var rootEl = document.getElementById("root");
        if (!rootInstance) rootInstance = ReactDOM.createRoot(rootEl);
        rootInstance.render(React.createElement(Component));
      } catch (e) {
        document.getElementById("root").innerHTML = '<pre class="error">' + e.message + "</pre>";
      }
    });
  </script>
</body>
</html>`;
}

// JSX сниппеты для autocomplete
const JSX_SNIPPETS = [
    {
        label: "div",
        detail: "<div>...</div>",
        insertText: "<div>$1</div>",
    },
    {
        label: "p",
        detail: "<p>...</p>",
        insertText: "<p>$1</p>",
    },
    {
        label: "span",
        detail: "<span>...</span>",
        insertText: "<span>$1</span>",
    },
    {
        label: "h1",
        detail: "<h1>...</h1>",
        insertText: "<h1>$1</h1>",
    },
    {
        label: "h2",
        detail: "<h2>...</h2>",
        insertText: "<h2>$1</h2>",
    },
    {
        label: "h3",
        detail: "<h3>...</h3>",
        insertText: "<h3>$1</h3>",
    },
    {
        label: "ul",
        detail: "<ul><li>...</li></ul>",
        insertText: "<ul>\n  <li>$1</li>\n</ul>",
    },
    {
        label: "li",
        detail: "<li>...</li>",
        insertText: "<li>$1</li>",
    },
    {
        label: "ol",
        detail: "<ol><li>...</li></ol>",
        insertText: "<ol>\n  <li>$1</li>\n</ol>",
    },
    {
        label: "button",
        detail: "<button onClick={...}>...</button>",
        insertText: "<button onClick={$1}>$2</button>",
    },
    {
        label: "input",
        detail: "<input value={...} onChange={...} />",
        insertText:
            '<input value={$1} onChange={(e) => $2} placeholder="$3" />',
    },
    {
        label: "img",
        detail: "<img src={...} alt={...} />",
        insertText: '<img src={$1} alt="$2" />',
    },
    {
        label: "a",
        detail: "<a href={...}>...</a>",
        insertText: '<a href="$1">$2</a>',
    },
    {
        label: "form",
        detail: "<form onSubmit={...}>...</form>",
        insertText: "<form onSubmit={$1}>\n  $2\n</form>",
    },
    {
        label: "label",
        detail: "<label>...</label>",
        insertText: "<label>$1</label>",
    },
    {
        label: "select",
        detail: "<select onChange={...}>...</select>",
        insertText:
            '<select onChange={$1}>\n  <option value="$2">$3</option>\n</select>',
    },
    {
        label: "textarea",
        detail: "<textarea value={...} onChange={...} />",
        insertText: "<textarea value={$1} onChange={(e) => $2} />",
    },
    {
        label: "useState",
        detail: "const [state, setState] = React.useState()",
        insertText:
            "const [$1, set${1/(.*)/${1:/capitalize}/}] = React.useState($2);",
    },
    {
        label: "useEffect",
        detail: "React.useEffect(() => {}, [])",
        insertText: "React.useEffect(() => {\n  $1\n}, [$2]);",
    },
    {
        label: "map",
        detail: "array.map((item) => <li key={}>)</li>",
        insertText: "{$1.map(($2, i) => (\n  <li key={i}>$3</li>\n))}",
    },
    {
        label: "ternary",
        detail: "{condition ? <A /> : <B />}",
        insertText: "{$1 ? ($2) : ($3)}",
    },
    {
        label: "&&",
        detail: "{condition && <Component />}",
        insertText: "{$1 && ($2)}",
    },
    {
        label: "fn",
        detail: "function name() {}",
        insertText: "function $1() {\n  $2\n}",
    },
    {
        label: "arrow",
        detail: "const fn = () => {}",
        insertText: "const $1 = ($2) => {\n  $3\n};",
    },
];

function registerJSXCompletions(monaco) {
    const provider = {
        provideCompletionItems(model, position) {
            const word = model.getWordUntilPosition(position);
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endColumn: word.endColumn,
            };

            const suggestions = JSX_SNIPPETS.map((snippet) => ({
                label: snippet.label,
                kind: monaco.languages.CompletionItemKind.Snippet,
                detail: snippet.detail,
                insertText: snippet.insertText,
                insertTextRules:
                    monaco.languages.CompletionItemInsertTextRule
                        .InsertAsSnippet,
                range,
            }));

            return { suggestions };
        },
    };

    // Регистрируем для javascript и typescript (Monaco использует их для JSX)
    monaco.languages.registerCompletionItemProvider("javascript", provider);
    monaco.languages.registerCompletionItemProvider("typescript", provider);
}

function CodeTask({ value, setValue, storageKey = STORAGE_KEY }) {
    const editorRef = useRef(null);
    const iframeRef = useRef(null);
    const [iframeDoc, setIframeDoc] = useState(null);

    useEffect(() => {
        Promise.all([
            fetchScript(CDN.react),
            fetchScript(CDN.reactDom),
            fetchScript(CDN.babel),
        ])
            .then(([reactSrc, reactDomSrc, babelSrc]) => {
                setIframeDoc(buildIframeHtml(reactSrc, reactDomSrc, babelSrc));
            })
            .catch((e) => {
                console.error("Failed to load preview scripts:", e);
            });
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem(storageKey);
        if (saved) setValue(saved);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    useEffect(() => {
        if (value) localStorage.setItem(storageKey, value);
    }, [value, storageKey]);

    const sendToIframe = useCallback((code) => {
        iframeRef.current?.contentWindow?.postMessage(code, "*");
    }, []);

    useEffect(() => {
        sendToIframe(value || TEMPLATE);
    }, [value, sendToIframe]);

    const handleIframeLoad = useCallback(() => {
        sendToIframe(value || TEMPLATE);
    }, [value, sendToIframe]);

    const handleMount = useCallback((editor, monaco) => {
        editorRef.current = editor;
        registerJSXCompletions(monaco);
    }, []);

    const handleChange = useCallback(
        (newValue) => {
            if (newValue === undefined) return;
            setValue(newValue);
        },
        [setValue],
    );

    return (
        <div className="codetask-wrapper">
            <div className="codetask-pane codetask-pane--editor">
                <div className="codetask-pane-header">
                    <span className="codetask-pane-header__dot" />
                    <span className="codetask-pane-header__label">code</span>
                </div>
                <Editor
                    height="100%"
                    defaultLanguage="javascript"
                    value={value || TEMPLATE}
                    onChange={handleChange}
                    onMount={handleMount}
                    theme="vs-dark"
                    options={{
                        fontSize: 13,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        lineNumbers: "on",
                        wordWrap: "on",
                        tabSize: 2,
                        padding: { top: 12 },
                        quickSuggestions: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: "on",
                        snippetSuggestions: "top",
                    }}
                />
            </div>

            <div className="codetask-pane codetask-pane--preview">
                <div className="codetask-pane-header">
                    <span className="codetask-pane-header__dot codetask-pane-header__dot--green" />
                    <span className="codetask-pane-header__label">preview</span>
                </div>

                {iframeDoc ? (
                    <iframe
                        ref={iframeRef}
                        className="codetask-iframe"
                        sandbox="allow-scripts"
                        title="preview"
                        srcDoc={iframeDoc}
                        onLoad={handleIframeLoad}
                    />
                ) : (
                    <div className="codetask-loading">Loading preview…</div>
                )}
            </div>
        </div>
    );
}

export default CodeTask;
