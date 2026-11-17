using System;
using System.Runtime.InteropServices;
using AOT;
using UnityEngine;
using UnityEngine.Animations;
using UnityEngine.Playables;
using UnityEngine.Rendering;

public sealed class StackFixture : MonoBehaviour
{
    public Transform Model;
    public Animator Animator;
    public Camera View;
    public AnimationClip[] Clips;

    private const float BlendSeconds = 0.23f;
    private static readonly string[] FaceNames = { "Blink", "BrowLift", "Smile" };
    private static StackFixture fixture;
    private readonly AnimationClipPlayable[] players = new AnimationClipPlayable[2];
    private readonly SkinnedMeshRenderer[] faceRenderers = new SkinnedMeshRenderer[FaceNames.Length];
    private readonly int[] faceIndices = new int[FaceNames.Length];
    private readonly float[] faceScales = new float[FaceNames.Length];
    private readonly float[] faceValues = new float[FaceNames.Length];
    private PlayableGraph graph;
    private AnimationMixerPlayable mixer;
    private int activeSlot;
    private int activeClip = -1;
    private float blendTime = BlendSeconds;
    private bool paused;
    private float stillTime = -1f;

#if UNITY_WEBGL && !UNITY_EDITOR
    private delegate void PoseCallback(int clip, int pause, float time,
        float x, float z, float yaw, float cameraX, float cameraY, float cameraZ,
        float targetX, float targetY, float targetZ, float blink, float brow, float smile);

    [DllImport("__Internal")]
    private static extern void StackConfigure(PoseCallback applyPose, Action snapshot,
        string engine, string backend, string clips, string faces);

    [DllImport("__Internal")]
    private static extern void StackRendered();

    [DllImport("__Internal")]
    private static extern void StackSnapshot(string clip, float time, float blink, float brow, float smile);

    [DllImport("__Internal")]
    private static extern void StackFail(string message);
#endif

    private void Start()
    {
        try
        {
            fixture = this;
            var renderers = Model.GetComponentsInChildren<SkinnedMeshRenderer>();
            for (var i = 0; i < FaceNames.Length; i++)
            {
                foreach (var renderer in renderers)
                {
                    var index = renderer.sharedMesh.GetBlendShapeIndex(FaceNames[i]);
                    if (index < 0)
                        continue;
                    faceRenderers[i] = renderer;
                    faceIndices[i] = index;
                    // glTFast's imported shapes reach their full pose at the authored frame weight.
                    faceScales[i] = renderer.sharedMesh.GetBlendShapeFrameWeight(index,
                        renderer.sharedMesh.GetBlendShapeFrameCount(index) - 1);
                    break;
                }
                if (faceRenderers[i] == null)
                    throw new InvalidOperationException("Missing facial pose " + FaceNames[i]);
            }

            graph = PlayableGraph.Create("Matched David clips");
            graph.SetTimeUpdateMode(DirectorUpdateMode.Manual);
            mixer = AnimationMixerPlayable.Create(graph, players.Length);
            AnimationPlayableOutput.Create(graph, "David", Animator).SetSourcePlayable(mixer);
            graph.Play();

#if UNITY_WEBGL && !UNITY_EDITOR
            WebGLInput.captureAllKeyboardInput = false;
            var names = Array.ConvertAll(Clips, clip => clip.name);
            var backend = SystemInfo.graphicsDeviceType == GraphicsDeviceType.OpenGLES3
                ? "webgl2" : SystemInfo.graphicsDeviceType.ToString();
            RenderPipelineManager.endCameraRendering += OnCameraRendered;
            StackConfigure(ApplyPose, PublishSnapshot, "Unity " + Application.unityVersion,
                backend, string.Join(",", names), string.Join(",", FaceNames));
#else
            ChangeClip(Array.FindIndex(Clips, clip => clip.name == "idle_relaxed"), false);
#endif
        }
        catch (Exception exception)
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            StackFail(exception.ToString());
#else
            Debug.LogException(exception, this);
#endif
            enabled = false;
        }
    }

    private void ChangeClip(int next, bool sample)
    {
        var previous = activeSlot;
        activeSlot = 1 - activeSlot;
        if (players[activeSlot].IsValid())
        {
            graph.Disconnect(mixer, activeSlot);
            graph.DestroyPlayable(players[activeSlot]);
        }

        var player = AnimationClipPlayable.Create(graph, Clips[next]);
        player.SetApplyFootIK(false);
        players[activeSlot] = player;
        graph.Connect(player, 0, mixer, activeSlot);
        blendTime = activeClip < 0 || sample ? BlendSeconds : 0f;
        activeClip = next;
        ApplyBlend(previous);
    }

    private void ApplyBlend(int previous)
    {
        var weight = Mathf.Clamp01(blendTime / BlendSeconds);
        mixer.SetInputWeight(activeSlot, weight);
        mixer.SetInputWeight(previous, 1f - weight);
    }

    private void Update()
    {
        if (activeClip < 0)
            return;

        if (stillTime >= 0f)
        {
            players[activeSlot].SetTime(stillTime);
            graph.Evaluate(0f);
        }
        else if (!paused)
        {
            var delta = Mathf.Min(Time.unscaledDeltaTime, 0.1f);
            blendTime += delta;
            ApplyBlend(1 - activeSlot);
            graph.Evaluate(delta);
        }

        for (var i = 0; i < faceValues.Length; i++)
            faceRenderers[i].SetBlendShapeWeight(faceIndices[i], faceValues[i] * faceScales[i]);
    }

    private void OnDestroy()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        RenderPipelineManager.endCameraRendering -= OnCameraRendered;
#endif
        if (graph.IsValid())
            graph.Destroy();
        if (fixture == this)
            fixture = null;
    }

#if UNITY_WEBGL && !UNITY_EDITOR
    [MonoPInvokeCallback(typeof(PoseCallback))]
    private static void ApplyPose(int clip, int pause, float time, float x, float z, float yaw,
        float cameraX, float cameraY, float cameraZ, float targetX, float targetY, float targetZ,
        float blink, float brow, float smile)
    {
        if (clip >= 0)
            fixture.ChangeClip(clip, time >= 0f);
        fixture.paused = pause != 0;
        fixture.stillTime = time;
        // glTFast reflects X when importing into Unity's coordinate system.
        fixture.Model.SetPositionAndRotation(new Vector3(-x, 0f, z), Quaternion.Euler(0f, -yaw * Mathf.Rad2Deg, 0f));
        fixture.View.transform.position = new Vector3(-cameraX, cameraY, cameraZ);
        fixture.View.transform.LookAt(new Vector3(-targetX, targetY, targetZ));
        fixture.faceValues[0] = blink;
        fixture.faceValues[1] = brow;
        fixture.faceValues[2] = smile;
    }

    [MonoPInvokeCallback(typeof(Action))]
    private static void PublishSnapshot()
    {
        var clip = fixture.activeClip;
        if (clip < 0)
            return;
        var renderers = fixture.faceRenderers;
        var indices = fixture.faceIndices;
        StackSnapshot(fixture.Clips[clip].name, (float)fixture.players[fixture.activeSlot].GetTime(),
            renderers[0].GetBlendShapeWeight(indices[0]) / fixture.faceScales[0],
            renderers[1].GetBlendShapeWeight(indices[1]) / fixture.faceScales[1],
            renderers[2].GetBlendShapeWeight(indices[2]) / fixture.faceScales[2]);
    }

    private void OnCameraRendered(ScriptableRenderContext _, Camera camera)
    {
        if (camera == View)
            StackRendered();
    }
#endif
}
