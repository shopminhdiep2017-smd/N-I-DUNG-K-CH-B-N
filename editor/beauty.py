"""Subtle face retouch: skin smoothing and teeth whitening, driven by face landmarks.

    "subject": {"beauty": {"smooth": 0.55, "teeth": 0.5}}

Landmarks come from MediaPipe Face Landmarker (editor/assets/models/face_landmarker.task).
Skin is smoothed only inside the face oval, never on eyes, brows or lips, and some
fine texture is added back so the face doesn't look plastic. Teeth are whitened
only inside the inner-lip contour, only on bright low-saturation pixels.
If no face is found on a frame, the frame is left untouched.
"""
from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

MODEL = Path(__file__).parent / "assets" / "models" / "face_landmarker.task"

FACE_OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148,
             176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109]
LEFT_EYE = [263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466]
RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
LEFT_BROW = [276, 283, 282, 295, 285, 300, 293, 334, 296, 336]
RIGHT_BROW = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107]
LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185]
LIPS_INNER = [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191]
NOSTRILS = [98, 97, 2, 326, 327, 294, 278, 344, 440, 275, 4, 45, 220, 115, 48, 64]


class Beauty:
    def __init__(self, cfg: dict, fps: int):
        import mediapipe as mp
        from mediapipe.tasks.python import BaseOptions, vision
        self.mp = mp
        self.smooth = float(cfg.get("smooth", 0.5))
        self.teeth = float(cfg.get("teeth", 0.5))
        self.scale = float(cfg.get("detect_scale", 0.5))
        self.fps = fps
        self.det = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
            base_options=BaseOptions(model_asset_path=str(MODEL)),
            running_mode=vision.RunningMode.VIDEO, num_faces=1,
            min_face_detection_confidence=0.4, min_tracking_confidence=0.4))
        self.prev = None
        self.found = 0
        self.frames = 0

    def landmarks(self, rgb, i):
        h, w = rgb.shape[:2]
        small = cv2.resize(rgb, (int(w * self.scale), int(h * self.scale)), interpolation=cv2.INTER_AREA)
        res = self.det.detect_for_video(self.mp.Image(image_format=self.mp.ImageFormat.SRGB,
                                                      data=np.ascontiguousarray(small)), int(i * 1000 / self.fps))
        if not res.face_landmarks:
            return None
        pts = np.array([(p.x * w, p.y * h) for p in res.face_landmarks[0]], np.float32)
        if self.prev is not None and len(self.prev) == len(pts):   # light temporal smoothing, avoids jitter
            pts = 0.6 * pts + 0.4 * self.prev
        self.prev = pts
        return pts

    def apply(self, rgb: np.ndarray, i: int) -> np.ndarray:
        """rgb: HxWx3 uint8 (modified copy returned)."""
        self.frames += 1
        pts = self.landmarks(rgb, i)
        if pts is None:
            return rgb
        self.found += 1
        x0, y0 = np.floor(pts.min(0)).astype(int) - 40
        x1, y1 = np.ceil(pts.max(0)).astype(int) + 40
        h, w = rgb.shape[:2]
        x0, y0, x1, y1 = max(0, x0), max(0, y0), min(w, x1), min(h, y1)
        crop = rgb[y0:y1, x0:x1]
        p = pts - [x0, y0]
        out = crop.astype(np.float32)

        def poly(idx, val, m):
            cv2.fillPoly(m, [np.round(p[idx]).astype(np.int32)], val)

        if self.smooth > 0:
            m = np.zeros(crop.shape[:2], np.float32)
            poly(FACE_OVAL, 1.0, m)
            for part in (LEFT_EYE, RIGHT_EYE, LEFT_BROW, RIGHT_BROW, LIPS_OUTER):
                hull = cv2.convexHull(np.round(p[part]).astype(np.int32))
                cv2.fillConvexPoly(m, hull, 0.0)
                cv2.polylines(m, [hull], True, 0.0, thickness=9)          # keep edges crisp
            fw = max(9, int((p[:, 0].max() - p[:, 0].min()) * 0.06) | 1)
            m = cv2.GaussianBlur(m, (fw, fw), 0)
            # skin-tone gate (YCrCb) so hair/background inside the oval stay untouched
            ycc = cv2.cvtColor(crop, cv2.COLOR_RGB2YCrCb)
            skin = cv2.inRange(ycc, (40, 133, 77), (255, 178, 135)).astype(np.float32) / 255
            m *= cv2.GaussianBlur(skin, (9, 9), 0)
            smooth = cv2.bilateralFilter(crop, 9, 38, 7).astype(np.float32)
            detail = out - cv2.GaussianBlur(out, (0, 0), 1.2)              # fine texture, added back
            soft = smooth + 0.35 * detail
            a = (self.smooth * m)[..., None]
            out = out * (1 - a) + soft * a

        if self.teeth > 0:
            m = np.zeros(crop.shape[:2], np.float32)
            poly(LIPS_INNER, 1.0, m)
            if m.sum() > 30:                                                # mouth open
                lab = cv2.cvtColor(np.clip(out, 0, 255).astype(np.uint8), cv2.COLOR_RGB2LAB).astype(np.float32)
                L, A, B = lab[..., 0], lab[..., 1], lab[..., 2]
                tooth = ((L > 105) & (np.abs(A - 128) < 18) & (B > 120)).astype(np.float32)
                tm = cv2.GaussianBlur(m * tooth, (5, 5), 0) * self.teeth
                lab[..., 2] = B - (B - 128) * 0.75 * tm                    # remove yellow
                lab[..., 0] = np.minimum(255, L + 14 * tm)                  # a touch brighter
                out = cv2.cvtColor(np.clip(lab, 0, 255).astype(np.uint8), cv2.COLOR_LAB2RGB).astype(np.float32)

        res = rgb.copy()
        res[y0:y1, x0:x1] = np.clip(out, 0, 255).astype(np.uint8)
        return res
