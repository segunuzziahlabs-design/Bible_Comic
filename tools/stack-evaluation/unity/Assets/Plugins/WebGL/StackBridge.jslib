mergeInto(LibraryManager.library, {
    StackConfigure: function (applyPose, snapshot, engine, backend, clips, faces) {
        var clipNames = UTF8ToString(clips).split(',');
        var status = window.stackTest;
        status.backend = UTF8ToString(backend);
        status.clips = clipNames;
        status.morphs = UTF8ToString(faces).split(',');
        window.stack.snapshot = function () {
            {{{ makeDynCall('v', 'snapshot') }}}();
            return status.enginePose;
        };
        window.stack.configure(UTF8ToString(engine), function (clip, paused, time, x, z, yaw,
            cameraX, cameraY, cameraZ, targetX, targetY, targetZ, blink, brow, smile) {
            {{{ makeDynCall('viifffffffffffff', 'applyPose') }}}(
                clipNames.indexOf(clip), paused ? 1 : 0, time, x, z, yaw,
                cameraX, cameraY, cameraZ, targetX, targetY, targetZ, blink, brow, smile);
        }, function () {
            // Unity's Web template resizes the drawing buffer to the canvas CSS size.
        });
    },

    StackRendered: function () {
        window.stack.rendered();
    },

    StackSnapshot: function (clip, seconds, blink, brow, smile) {
        window.stackTest.enginePose = { clip: UTF8ToString(clip), seconds: seconds,
            faces: { Blink: blink, BrowLift: brow, Smile: smile } };
    },

    StackFail: function (message) {
        window.stack.fail(UTF8ToString(message));
    }
});
