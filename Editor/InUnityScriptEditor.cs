using UnityEditor;
using UnityEngine;
using System.IO;

namespace ScriptEditor 
{
    public class InUnityScriptEditor : EditorWindow
    {
        private string filePath = "";
        private string fileContent = "";
        private Vector2 scroll;
        private GUIStyle textAreaStyle;
        private bool hasUnsavedChanges;

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

            var window = GetWindow<InUnityScriptEditor>("Script Editor");
            window.LoadFile(Path.GetFullPath(path));
        }

        private void OnEnable()
        {
            textAreaStyle = new GUIStyle(EditorStyles.textArea)
            {
                font = Font.CreateDynamicFontFromOSFont("Consolas", 14),
                wordWrap = false
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

            EditorGUI.BeginDisabledGroup(string.IsNullOrEmpty(filePath));
            if (GUILayout.Button("Save", EditorStyles.toolbarButton, GUILayout.Width(50)))
            {
                SaveFile();
            }
            EditorGUI.EndDisabledGroup();

            GUILayout.Space(10);
            GUILayout.Label(string.IsNullOrEmpty(filePath) ? "No file loaded" : filePath);

            if (hasUnsavedChanges)
            {
                GUILayout.Label("*", GUILayout.Width(10));
            }

            EditorGUILayout.EndHorizontal();
        }

        private void DrawEditorArea()
        {
            if (string.IsNullOrEmpty(filePath))
            {
                EditorGUILayout.HelpBox("Select a .cs file in the Project window or click Open.", MessageType.Info);
                return;
            }

            EditorGUI.BeginChangeCheck();

            scroll = EditorGUILayout.BeginScrollView(scroll);
            fileContent = EditorGUILayout.TextArea(fileContent, textAreaStyle, GUILayout.ExpandHeight(true));
            EditorGUILayout.EndScrollView();

            if (EditorGUI.EndChangeCheck())
            {
                hasUnsavedChanges = true;
            }
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

            filePath = fullPath;
            fileContent = File.ReadAllText(filePath);
            hasUnsavedChanges = false;
            Repaint();
        }

        private void OpenFileDialog()
        {
            string path = EditorUtility.OpenFilePanel(
                "Open C# Script",
                Application.dataPath,
                "cs"
            );

            if (string.IsNullOrEmpty(path))
            {
                return;
            }

            LoadFile(path);
        }

        private void SaveFile()
        {
            if (string.IsNullOrEmpty(filePath))
            {
                return;
            }

            File.WriteAllText(filePath, fileContent);
            hasUnsavedChanges = false;
            AssetDatabase.Refresh();
        }
    }

}