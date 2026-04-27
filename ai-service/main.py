from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
import random
import tempfile
import os
import traceback
import requests

DEEPFACE_READY = False
DEEPFACE_IMPORT_ERROR = None

try:
    from deepface import DeepFace
    DEEPFACE_READY = True
except Exception as e:
    DEEPFACE_IMPORT_ERROR = str(e)

app = FastAPI(title="SafeFind AI Service")


class FaceVerifyPayload(BaseModel):
    reference_image_url: str
    candidate_image_url: str


class RiskPayload(BaseModel):
    description: str
    location_label: Optional[str] = None


def download_image(url: str, suffix: str = ".jpg") -> str:
    response = requests.get(url, timeout=20)
    response.raise_for_status()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(response.content)
        return tmp.name


@app.get("/")
def health():
    return {
        "status": "ok",
        "deepface_ready": DEEPFACE_READY,
        "deepface_import_error": DEEPFACE_IMPORT_ERROR,
    }


@app.post("/face/verify")
def face_verify(payload: FaceVerifyPayload):
    reference_path = None
    candidate_path = None

    try:
        reference_path = download_image(payload.reference_image_url)
        candidate_path = download_image(payload.candidate_image_url)

        if DEEPFACE_READY:
            result = DeepFace.verify(
                img1_path=reference_path,
                img2_path=candidate_path,
                model_name="Facenet",
                detector_backend="opencv",
                enforce_detection=False,
            )

            distance = float(result.get("distance", 1.0))
            verified = bool(result.get("verified", False))

            face_match_score = max(0, min(100, round((1 - distance) * 100)))
            ai_confidence = face_match_score if verified else max(0, face_match_score - 10)

            return {
                "faceMatchScore": face_match_score,
                "aiConfidence": ai_confidence,
                "provider": "deepface",
                "verified": verified,
                "distance": distance,
                "model": "Facenet",
                "detector": "opencv",
                "note": "Résultat IA à confirmer par validation humaine.",
            }

        return {
            "faceMatchScore": 74,
            "aiConfidence": 68,
            "provider": "heuristic-fallback",
            "verified": False,
            "note": "DeepFace indisponible. Fallback utilisé.",
            "deepface_import_error": DEEPFACE_IMPORT_ERROR,
        }

    except Exception as e:
        return {
            "faceMatchScore": 0,
            "aiConfidence": 0,
            "provider": "error-fallback",
            "verified": False,
            "error": str(e),
            "trace": traceback.format_exc(),
        }

    finally:
        for path in [reference_path, candidate_path]:
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except Exception:
                    pass


@app.post("/risk/analyze")
def risk_analyze(payload: RiskPayload):
    desc = (payload.description or "").strip()
    risk = 38
    reasons = []

    if len(desc) > 80:
        risk -= 10
        reasons.append("Description détaillée.")
    else:
        risk += 8
        reasons.append("Description courte.")

    if payload.location_label:
        risk -= 6
        reasons.append("Lieu indiqué.")

    risk = max(5, min(95, risk + random.randint(-3, 3)))

    return {
        "false_info_risk": risk,
        "reasons": reasons,
    }