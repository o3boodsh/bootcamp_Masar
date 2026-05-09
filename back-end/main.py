from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uvicorn

app = FastAPI(title="AidFlow API", version="1.0.0")

# Allow frontend to communicate with the API
app.add_middleware(
    CORSMiddleware,
    # In production, replace with your frontend domain
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class DistributionPoint(BaseModel):
    point_name: str
    type: str
    area: str
    organization: str
    address: str
    status: str

class DistributionPointResponse(DistributionPoint):
    id: int
    created_at: str

# In-memory storage (replace with a real DB in production)
distribution_points: List[DistributionPointResponse] = []
counter = {"id": 1}

# Routes
@app.get("/")
def root():
    return {"message": "AidFlow API is running"}

@app.post("/api/distribution-points", response_model=DistributionPointResponse, status_code=201)
def add_distribution_point(point: DistributionPoint):
    new_point = DistributionPointResponse(
        id=counter["id"],
        created_at=datetime.utcnow().isoformat(),
        **point.model_dump()
    )
    distribution_points.append(new_point)
    counter["id"] += 1
    return new_point

@app.get("/api/distribution-points", response_model=List[DistributionPointResponse])
def get_distribution_points():
    return distribution_points

@app.delete("/api/distribution-points/{point_id}")
def delete_distribution_point(point_id: int):
    global distribution_points
    distribution_points = [p for p in distribution_points if p.id != point_id]
    return {"message": f"Point {point_id} deleted"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)