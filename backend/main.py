import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import uvicorn

app = FastAPI(title="AidFlow API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Firebase Config ──
FIREBASE_URL = "https://bootcamp-a37b4-default-rtdb.firebaseio.com"
COLLECTION = "distribution_points"


# ── Models ──
class DistributionPoint(BaseModel):
    point_name: str
    type: str
    area: str
    organization: str
    address: str
    status: str


class DistributionPointUpdate(BaseModel):
    point_name: str | None = None
    type: str | None = None
    area: str | None = None
    organization: str | None = None
    address: str | None = None
    status: str | None = None


# ── Helper ──
def fb_url(path: str = "") -> str:
    return f"{FIREBASE_URL}/{COLLECTION}{path}.json"


# ── Routes ──
@app.get("/")
def root():
    return {"message": "AidFlow API v2 – Firebase connected"}


# CREATE
@app.post("/api/distribution-points", status_code=201)
async def add_distribution_point(point: DistributionPoint):
    async with httpx.AsyncClient() as client:
        # 1. Get current counter from Firebase
        counter_res = await client.get(f"{FIREBASE_URL}/counter.json")
        current_id = counter_res.json() or 0
        new_id = current_id + 1

        # 2. Save the new point with the sequential ID
        payload = {
            "id": new_id,
            **point.model_dump(),
            "created_at": datetime.utcnow().isoformat(),
        }
        write_res = await client.put(
            f"{FIREBASE_URL}/{COLLECTION}/{new_id}.json",
            json=payload
        )
        if write_res.status_code != 200:
            raise HTTPException(status_code=502, detail="Firebase write failed")

        # 3. Update the counter
        await client.put(f"{FIREBASE_URL}/counter.json", json=new_id)

    return payload


# READ ALL
@app.get("/api/distribution-points")
async def get_distribution_points():
    async with httpx.AsyncClient() as client:
        res = await client.get(fb_url())
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Firebase read failed")
    data = res.json()
    if not data:
        return []
    return [{"id": k, **v} for k, v in data.items()]


# READ ONE
@app.get("/api/distribution-points/{point_id}")
async def get_distribution_point(point_id: str):
    async with httpx.AsyncClient() as client:
        res = await client.get(fb_url(f"/{point_id}"))
    if res.status_code != 200 or res.json() is None:
        raise HTTPException(status_code=404, detail="Point not found")
    return {"id": point_id, **res.json()}


# UPDATE (PATCH – partial update)
@app.patch("/api/distribution-points/{point_id}")
async def update_distribution_point(point_id: str, updates: DistributionPointUpdate):
    payload = {k: v for k, v in updates.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="No fields to update")
    payload["updated_at"] = datetime.utcnow().isoformat()
    async with httpx.AsyncClient() as client:
        res = await client.patch(fb_url(f"/{point_id}"), json=payload)
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Firebase update failed")
    return {"id": point_id, **res.json()}


# DELETE
@app.delete("/api/distribution-points/{point_id}")
async def delete_distribution_point(point_id: str):
    async with httpx.AsyncClient() as client:
        res = await client.delete(fb_url(f"/{point_id}"))
    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="Firebase delete failed")
    return {"message": f"Point {point_id} deleted successfully"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)