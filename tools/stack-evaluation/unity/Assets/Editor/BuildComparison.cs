using System;
using System.IO;
using System.Linq;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.Rendering;
using UnityEngine.Rendering.Universal;
using UnityEngine.SceneManagement;

public static class BuildComparison
{
    private const string ModelPath = "Assets/David.glb";
    private const string ScenePath = "Assets/Comparison.unity";
    private static readonly string[] ClipNames = {
        "acknowledge", "idle_relaxed", "listen", "listen_to_provisions", "pickup_provisions", "walk_forward"
    };

    public static void Run()
    {
        ConfigurePipeline();
        PlayerSettings.colorSpace = ColorSpace.Linear;
        PlayerSettings.WebGL.threadsSupport = false;
        PlayerSettings.WebGL.dataCaching = false;
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        PlayerSettings.WebGL.template = "PROJECT:StackComparison";
        PlayerSettings.SetUseDefaultGraphicsAPIs(BuildTarget.WebGL, false);
        PlayerSettings.SetGraphicsAPIs(BuildTarget.WebGL, new[] { GraphicsDeviceType.OpenGLES3 });
        AssetDatabase.SaveAssets();

        var source = Path.Combine(Path.GetDirectoryName(Application.dataPath), "david.glb");
        File.Copy(source, ModelPath, true);
        AssetDatabase.ImportAsset(ModelPath, ImportAssetOptions.ForceSynchronousImport | ImportAssetOptions.ForceUpdate);
        var prefab = AssetDatabase.LoadAssetAtPath<GameObject>(ModelPath);
        if (prefab == null)
            throw new InvalidOperationException("glTFast did not import the David GLB as a GameObject.");
        var imported = AssetDatabase.LoadAllAssetsAtPath(ModelPath).OfType<AnimationClip>().ToArray();
        var clips = ClipNames.Select(name => imported.Single(clip => clip.name == name)).ToArray();

        MakeScene(prefab, clips);
        var output = Path.GetFullPath(Path.Combine(Application.dataPath, "../../web/unity"));
        var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions {
            scenes = new[] { ScenePath },
            locationPathName = output,
            target = BuildTarget.WebGL,
            options = BuildOptions.StrictMode
        });
        if (report.summary.result != BuildResult.Succeeded)
            throw new InvalidOperationException("Unity Web build " + report.summary.result);
        Debug.Log($"Matched Unity Web export complete: {report.summary.totalSize} bytes.");
    }

    private static void ConfigurePipeline()
    {
        const string rendererPath = "Assets/ComparisonRenderer.asset";
        const string pipelinePath = "Assets/ComparisonPipeline.asset";
        var pipeline = AssetDatabase.LoadAssetAtPath<UniversalRenderPipelineAsset>(pipelinePath);
        if (pipeline == null)
        {
            var renderer = AssetDatabase.LoadAssetAtPath<UniversalRendererData>(rendererPath);
            if (renderer == null)
            {
                renderer = ScriptableObject.CreateInstance<UniversalRendererData>();
                AssetDatabase.CreateAsset(renderer, rendererPath);
            }
            pipeline = UniversalRenderPipelineAsset.Create(renderer);
            AssetDatabase.CreateAsset(pipeline, pipelinePath);
        }

        pipeline.msaaSampleCount = 1;
        pipeline.supportsHDR = false;
        pipeline.renderScale = 1f;
        pipeline.shadowCascadeCount = 1;
        pipeline.shadowDistance = 8f;
        pipeline.mainLightShadowmapResolution = 1024;
        var shadowSettings = new SerializedObject(pipeline);
        shadowSettings.FindProperty("m_SoftShadowsSupported").boolValue = true;
        shadowSettings.ApplyModifiedPropertiesWithoutUndo();
        GraphicsSettings.defaultRenderPipeline = pipeline;
        QualitySettings.renderPipeline = pipeline;
        EditorUtility.SetDirty(pipeline);
    }

    private static void MakeScene(GameObject prefab, AnimationClip[] clips)
    {
        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var root = new GameObject("Matched comparison");
        var fixture = root.AddComponent<StackFixture>();
        var model = (GameObject)PrefabUtility.InstantiatePrefab(prefab, scene);
        fixture.Model = model.transform;
        fixture.Animator = model.GetComponent<Animator>() ?? model.AddComponent<Animator>();
        fixture.Animator.applyRootMotion = false;
        fixture.Animator.cullingMode = AnimatorCullingMode.AlwaysAnimate;
        fixture.Clips = clips;

        var camera = new GameObject("Comparison camera").AddComponent<Camera>();
        camera.clearFlags = CameraClearFlags.SolidColor;
        ColorUtility.TryParseHtmlString("#3b5155", out var background);
        camera.backgroundColor = background;
        camera.fieldOfView = 38f;
        camera.nearClipPlane = 0.05f;
        camera.farClipPlane = 32f;
        camera.allowHDR = false;
        camera.allowMSAA = false;
        camera.transform.position = new Vector3(-0.7f, 1.29f, 4.2f);
        camera.transform.LookAt(new Vector3(0f, 0.93f, 0f));
        fixture.View = camera;

        RenderSettings.ambientMode = AmbientMode.Flat;
        RenderSettings.ambientLight = new Color(0.57f, 0.56f, 0.54f);
        var light = new GameObject("Directional key").AddComponent<Light>();
        light.type = LightType.Directional;
        light.color = new Color(1f, 0.94f, 0.85f);
        light.intensity = 1.35f;
        light.shadows = LightShadows.Soft;
        light.transform.rotation = Quaternion.LookRotation(new Vector3(-0.314f, -0.743f, -0.591f));
        RenderSettings.sun = light;

        var floor = GameObject.CreatePrimitive(PrimitiveType.Cube);
        floor.name = "Floor";
        UnityEngine.Object.DestroyImmediate(floor.GetComponent<Collider>());
        floor.transform.position = new Vector3(0f, -0.05f, 0f);
        floor.transform.localScale = new Vector3(14f, 0.10f, 12f);
        var floorMaterial = AssetDatabase.LoadAssetAtPath<Material>("Assets/Floor.mat");
        if (floorMaterial == null)
        {
            floorMaterial = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            AssetDatabase.CreateAsset(floorMaterial, "Assets/Floor.mat");
        }
        floorMaterial.SetColor("_BaseColor", new Color(0.40f, 0.37f, 0.33f));
        floorMaterial.SetFloat("_Smoothness", 0.12f);
        var floorRenderer = floor.GetComponent<MeshRenderer>();
        floorRenderer.sharedMaterial = floorMaterial;
        floorRenderer.shadowCastingMode = ShadowCastingMode.Off;
        EditorSceneManager.SaveScene(scene, ScenePath);
        AssetDatabase.SaveAssets();
    }
}
