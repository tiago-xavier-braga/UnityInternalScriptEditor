using UnityEditor;
using UnityEngine;
using System.IO;
using System.Text;

namespace XaviGames.CodeEditor
{
    public class InUnityScriptEditor : EditorWindow
    {
        private string _filePath = "";
        private string _fileContent = "";
        private Vector2 _scroll;
        private bool _hasUnsavedChanges;

        private GUIStyle _textAreaStyle;
        private GUIStyle _lineNumberStyle;

        [MenuItem("Tools/In-Unity Script Editor")]
        public static void OpenWindow()
        {
            GetWindow<InUnityScriptEditor>("Script Editor");
        }

        [MenuItem("Assets/Open In In-Unity Script Editor", priority = 100)]
        private static void OpenFromProject()
        {
            Object selected = Selection.activeObject;

            if (selected == null)
            {
                return;
            }

            string path = AssetDatabase.GetAssetPath(selected);

            if (!path.EndsWith(".cs"))
            {
                return;
            }

            InUnityScriptEditor window = GetWindow<InUnityScriptEditor>("Script Editor");
            window.LoadFile(Path.GetFullPath(path));
        }

        private void OnEnable()
        {
            _textAreaStyle = new GUIStyle(EditorStyles.textArea)
            {
                font = Font.CreateDynamicFontFromOSFont(
                    new[] { "Consolas", "Menlo", "Courier New" }, 20),
                wordWrap = false
            };

            _lineNumberStyle = new GUIStyle(EditorStyles.label)
            {
                alignment = TextAnchor.UpperRight,
                padding = new RectOffset(0, 6, 2, 0),
                normal = { textColor = new Color(0.55f, 0.55f, 0.55f) }
            };

            TryLoadSelectedScript();
        }

        private void OnGUI()
        {
            DrawToolbar();
            DrawEditorArea();
        }

        private void DrawToolbar()
        {
            EditorGUILayout.BeginHorizontal(EditorStyles.toolbar);

            if (GUILayout.Button("Open", EditorStyles.toolbarButton, GUILayout.Width(50)))
            {
                OpenFileDialog();
            }

            if (GUILayout.Button("Open Selected", EditorStyles.toolbarButton, GUILayout.Width(90)))
            {
                TryLoadSelectedScript();
            }

            EditorGUI.BeginDisabledGroup(string.IsNullOrEmpty(_filePath));

            if (GUILayout.Button("Save", EditorStyles.toolbarButton, GUILayout.Width(50)))
            {
                SaveFile();
            }

            EditorGUI.EndDisabledGroup();

            GUILayout.Space(10);
            GUILayout.Label(string.IsNullOrEmpty(_filePath) ? "No file loaded" : _filePath);

            if (_hasUnsavedChanges)
            {
                GUILayout.Label("*", GUILayout.Width(10));
            }

            EditorGUILayout.EndHorizontal();
        }

        private void DrawEditorArea()
        {
            if (string.IsNullOrEmpty(_filePath))
            {
                EditorGUILayout.HelpBox(
                    "Select a .cs file in the Project window or click Open.",
                    MessageType.Info);
                return;
            }

            EditorGUI.BeginChangeCheck();

            _scroll = EditorGUILayout.BeginScrollView(_scroll);
            EditorGUILayout.BeginHorizontal();

            DrawLineNumbers();
            DrawTextEditor();

            EditorGUILayout.EndHorizontal();
            EditorGUILayout.EndScrollView();

            if (EditorGUI.EndChangeCheck())
            {
                _hasUnsavedChanges = true;
            }
        }

        private void DrawLineNumbers()
        {
            int lineCount = Mathf.Max(1, _fileContent.Split('\n').Length);

            EditorGUILayout.BeginVertical(GUILayout.Width(45));

            for (int i = 1; i <= lineCount; i++)
            {
                GUILayout.Label(i.ToString(), _lineNumberStyle);
            }

            EditorGUILayout.EndVertical();
        }

        private void DrawTextEditor()
        {
            _fileContent = EditorGUILayout.TextArea(
                _fileContent,
                _textAreaStyle,
                GUILayout.ExpandHeight(true),
                GUILayout.ExpandWidth(true));
        }

        private void TryLoadSelectedScript()
        {
            Object selected = Selection.activeObject;

            if (selected == null)
            {
                return;
            }

            string assetPath = AssetDatabase.GetAssetPath(selected);

            if (string.IsNullOrEmpty(assetPath) || !assetPath.EndsWith(".cs"))
            {
                return;
            }

            LoadFile(Path.GetFullPath(assetPath));
        }

        private void LoadFile(string fullPath)
        {
            if (!File.Exists(fullPath))
            {
                return;
            }

            _filePath = fullPath;

            _fileContent = File.ReadAllText(_filePath)
                .Replace("\r\n", "\n");

            _hasUnsavedChanges = false;
            Repaint();
        }

        private void OpenFileDialog()
        {
            string path = EditorUtility.OpenFilePanel(
                "Open C# Script",
                Application.dataPath,
                "cs");

            if (!string.IsNullOrEmpty(path))
            {
                LoadFile(path);
            }
        }

        private void SaveFile()
        {
            if (string.IsNullOrEmpty(_filePath))
            {
                return;
            }

            string content = _fileContent.Replace("\r", "").Replace("\n", "\r\n");

            File.WriteAllText(
                _filePath,
                content,
                new UTF8Encoding(true)
            );

            _hasUnsavedChanges = false;
            AssetDatabase.Refresh();
        }
    }
}